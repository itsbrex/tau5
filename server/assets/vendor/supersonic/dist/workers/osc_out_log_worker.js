(() => {
  // js/lib/ring_buffer_core.js
  function readMessagesFromBuffer({
    uint8View: uint8View2,
    dataView: dataView2,
    bufferStart,
    bufferSize,
    head,
    tail,
    messageMagic,
    paddingMagic,
    headerSize,
    maxMessages = Infinity,
    onMessage,
    onCorruption
  }) {
    let currentTail = tail;
    let messagesRead = 0;
    while (currentTail !== head && messagesRead < maxMessages) {
      const bytesToEnd = bufferSize - currentTail;
      if (bytesToEnd < headerSize) {
        currentTail = 0;
        continue;
      }
      const readPos = bufferStart + currentTail;
      const magic = dataView2.getUint32(readPos, true);
      if (magic === paddingMagic) {
        currentTail = 0;
        continue;
      }
      if (magic !== messageMagic) {
        if (onCorruption) {
          onCorruption(currentTail);
        }
        currentTail = (currentTail + 1) % bufferSize;
        continue;
      }
      const length = dataView2.getUint32(readPos + 4, true);
      const sequence = dataView2.getUint32(readPos + 8, true);
      const sourceId = dataView2.getUint32(readPos + 12, true);
      if (length < headerSize || length > bufferSize) {
        if (onCorruption) {
          onCorruption(currentTail);
        }
        currentTail = (currentTail + 1) % bufferSize;
        continue;
      }
      const payloadLength = length - headerSize;
      const payloadStart = readPos + headerSize;
      const payload = new Uint8Array(payloadLength);
      for (let i = 0; i < payloadLength; i++) {
        payload[i] = uint8View2[payloadStart + i];
      }
      onMessage(payload, sequence, length, sourceId);
      currentTail = (currentTail + length) % bufferSize;
      messagesRead++;
    }
    return { newTail: currentTail, messagesRead };
  }

  // js/lib/control_offsets.js
  var IN_HEAD = 0;
  var IN_TAIL = 4;
  var IN_SEQUENCE = 24;
  var IN_WRITE_LOCK = 40;
  var IN_LOG_TAIL = 44;
  function calculateInControlIndices(ringBufferBase2, CONTROL_START) {
    const base = ringBufferBase2 + CONTROL_START;
    return {
      IN_HEAD: (base + IN_HEAD) / 4,
      IN_TAIL: (base + IN_TAIL) / 4,
      IN_SEQUENCE: (base + IN_SEQUENCE) / 4,
      IN_WRITE_LOCK: (base + IN_WRITE_LOCK) / 4,
      IN_LOG_TAIL: (base + IN_LOG_TAIL) / 4
    };
  }

  // js/workers/osc_out_log_worker.js
  var sharedBuffer = null;
  var ringBufferBase = null;
  var atomicView = null;
  var dataView = null;
  var uint8View = null;
  var bufferConstants = null;
  var CONTROL_INDICES = {};
  var running = false;
  var oscOutLogLog = (...args) => {
    if (true) {
      console.log(...args);
    }
  };
  var initRingBuffer = (buffer, base, constants) => {
    sharedBuffer = buffer;
    ringBufferBase = base;
    bufferConstants = constants;
    atomicView = new Int32Array(sharedBuffer);
    dataView = new DataView(sharedBuffer);
    uint8View = new Uint8Array(sharedBuffer);
    CONTROL_INDICES = calculateInControlIndices(ringBufferBase, bufferConstants.CONTROL_START);
  };
  var readLogMessages = () => {
    const head = Atomics.load(atomicView, CONTROL_INDICES.IN_HEAD);
    const logTail = Atomics.load(atomicView, CONTROL_INDICES.IN_LOG_TAIL);
    if (head === logTail) {
      return [];
    }
    const entries = [];
    const timestamp = performance.now();
    const { newTail, messagesRead } = readMessagesFromBuffer({
      uint8View,
      dataView,
      bufferStart: ringBufferBase + bufferConstants.IN_BUFFER_START,
      bufferSize: bufferConstants.IN_BUFFER_SIZE,
      head,
      tail: logTail,
      messageMagic: bufferConstants.MESSAGE_MAGIC,
      paddingMagic: bufferConstants.PADDING_MAGIC,
      headerSize: bufferConstants.MESSAGE_HEADER_SIZE,
      maxMessages: 100,
      onMessage: (payload, sequence, length, sourceId) => {
        entries.push({
          sourceId,
          oscData: payload,
          timestamp
        });
      },
      onCorruption: (position) => {
        console.error("[OSCOutLogWorker] Corrupted message at position", position);
      }
    });
    if (messagesRead > 0) {
      Atomics.store(atomicView, CONTROL_INDICES.IN_LOG_TAIL, newTail);
    }
    return entries;
  };
  var waitLoop = () => {
    while (running) {
      try {
        const currentHead = Atomics.load(atomicView, CONTROL_INDICES.IN_HEAD);
        const currentLogTail = Atomics.load(atomicView, CONTROL_INDICES.IN_LOG_TAIL);
        if (currentHead === currentLogTail) {
          const result = Atomics.wait(atomicView, CONTROL_INDICES.IN_HEAD, currentHead, 100);
          if (result === "ok" || result === "not-equal") {
          } else if (result === "timed-out") {
            continue;
          }
        }
        const entries = readLogMessages();
        if (entries.length > 0) {
          self.postMessage({
            type: "oscLog",
            entries
          });
        }
      } catch (error) {
        console.error("[OSCOutLogWorker] Error in wait loop:", error);
        self.postMessage({
          type: "error",
          error: error.message
        });
        Atomics.wait(atomicView, 0, atomicView[0], 10);
      }
    }
  };
  var start = () => {
    if (!sharedBuffer) {
      console.error("[OSCOutLogWorker] Cannot start - not initialized");
      return;
    }
    if (running) {
      console.warn("[OSCOutLogWorker] Already running");
      return;
    }
    running = true;
    waitLoop();
  };
  var stop = () => {
    running = false;
  };
  self.addEventListener("message", (event) => {
    const { data } = event;
    try {
      switch (data.type) {
        case "init":
          initRingBuffer(data.sharedBuffer, data.ringBufferBase, data.bufferConstants);
          self.postMessage({ type: "initialized" });
          break;
        case "start":
          start();
          break;
        case "stop":
          stop();
          break;
        default:
          console.warn("[OSCOutLogWorker] Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("[OSCOutLogWorker] Error:", error);
      self.postMessage({
        type: "error",
        error: error.message
      });
    }
  });
  oscOutLogLog("[OSCOutLogWorker] Script loaded");
})();
