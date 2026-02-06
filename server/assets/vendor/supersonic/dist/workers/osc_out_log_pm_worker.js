(() => {
  // js/lib/ring_buffer_core.js
  function readMessagesFromBuffer({
    uint8View,
    dataView,
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
      const magic = dataView.getUint32(readPos, true);
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
      const length = dataView.getUint32(readPos + 4, true);
      const sequence = dataView.getUint32(readPos + 8, true);
      const sourceId = dataView.getUint32(readPos + 12, true);
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
        payload[i] = uint8View[payloadStart + i];
      }
      onMessage(payload, sequence, length, sourceId);
      currentTail = (currentTail + length) % bufferSize;
      messagesRead++;
    }
    return { newTail: currentTail, messagesRead };
  }

  // js/workers/osc_out_log_pm_worker.js
  var bufferConstants = null;
  var workletPort = null;
  var oscOutLogPMLog = (...args) => {
    if (true) {
      console.log("[OSCOutLogPMWorker]", ...args);
    }
  };
  var parseBufferChunks = (chunks, timestamp) => {
    if (!bufferConstants) {
      console.error("[OSCOutLogPMWorker] Not initialized");
      return [];
    }
    let combinedBytes;
    if (chunks.length === 1) {
      combinedBytes = new Uint8Array(chunks[0].bytes);
    } else {
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.bytes.byteLength, 0);
      combinedBytes = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        const chunkBytes = new Uint8Array(chunk.bytes);
        combinedBytes.set(chunkBytes, offset);
        offset += chunkBytes.length;
      }
    }
    const uint8View = combinedBytes;
    const dataView = new DataView(combinedBytes.buffer);
    const entries = [];
    readMessagesFromBuffer({
      uint8View,
      dataView,
      bufferStart: 0,
      bufferSize: combinedBytes.length,
      head: combinedBytes.length,
      tail: 0,
      messageMagic: bufferConstants.MESSAGE_MAGIC,
      paddingMagic: bufferConstants.PADDING_MAGIC,
      headerSize: bufferConstants.MESSAGE_HEADER_SIZE,
      onMessage: (payload, sequence, length, sourceId) => {
        entries.push({
          sourceId,
          oscData: new Uint8Array(payload),
          timestamp
        });
      },
      onCorruption: (position) => {
        console.error("[OSCOutLogPMWorker] Corrupted message at position", position);
      }
    });
    return entries;
  };
  var handleWorkletMessage = (event) => {
    const { data } = event;
    if (data.type === "oscLogRaw") {
      const entries = parseBufferChunks(data.chunks, data.timestamp || performance.now());
      if (entries.length > 0) {
        self.postMessage({
          type: "oscLog",
          entries
        });
      }
    } else if (data.type === "oscLogEntries") {
      if (data.entries && data.entries.length > 0) {
        self.postMessage({
          type: "oscLog",
          entries: data.entries
        });
      }
    }
  };
  self.addEventListener("message", (event) => {
    const { data } = event;
    try {
      switch (data.type) {
        case "init":
          bufferConstants = data.bufferConstants;
          if (event.ports && event.ports.length > 0) {
            workletPort = event.ports[0];
            workletPort.onmessage = handleWorkletMessage;
            oscOutLogPMLog("Initialized with worklet port");
          } else {
            oscOutLogPMLog("Initialized without worklet port");
          }
          self.postMessage({ type: "initialized" });
          break;
        case "setWorkletPort":
          if (event.ports && event.ports.length > 0) {
            workletPort = event.ports[0];
            workletPort.onmessage = handleWorkletMessage;
            oscOutLogPMLog("Worklet port set");
          }
          break;
        default:
          console.warn("[OSCOutLogPMWorker] Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("[OSCOutLogPMWorker] Error:", error);
      self.postMessage({
        type: "error",
        error: error.message
      });
    }
  });
  oscOutLogPMLog("Script loaded");
})();
