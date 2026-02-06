/**
 * SuperSonic Panel
 *
 * Owns the SuperSonic audio engine lifecycle.
 * Creates, initializes, and displays engine state.
 * All rendering is client-side - no server round-trips for metrics.
 */

import { SuperSonic } from "../../vendor/supersonic/supersonic.js";

const MAX_LOG_ENTRIES = 200;
const STACKED_MIN_HEIGHT = 600;

export const SuperSonicPanel = {
  mounted() {
    this.logBuffers = {
      debug: [],
      oscOut: [],
      oscIn: []
    };

    this.activeTab = 'debug';
    this.isTabbed = false;
    this.analyser = null;
    this.scopeCanvas = null;
    this.scopeCtx = null;
    this.scopeAnimationId = null;

    // Store unsubscribe functions for cleanup
    this.unsubscribers = null;

    // Resize state
    this.isResizing = false;
    this.panelMinWidth = 280;
    this.panelMaxWidth = 800;

    // Restore saved width
    const savedWidth = localStorage.getItem('supersonic-panel-width');
    if (savedWidth) {
      this.el.style.width = `${savedWidth}px`;
    }

    this.initSupersonic();
    this.setupTabSwitching();
    this.setupLayoutMode();
    this.setupResize();

    window.addEventListener('resize', this.handleResize.bind(this));
  },

  destroyed() {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.stopScope();
    this.teardownSupersonicCallbacks();
    if (this.resizeCleanup) this.resizeCleanup();
  },

  async initSupersonic() {
    // Create the engine
    this.supersonic = new SuperSonic({
      workerBaseURL: '/supersonic/dist/workers/',
      wasmBaseURL: '/supersonic/dist/wasm/',
      sampleBaseURL: '/supersonic/samples/',
      synthdefBaseURL: '/supersonic/synthdefs/',
      activityEvent: { maxLineLength: 200 }
    });

    // Expose globally for console access and other components
    window.supersonic = this.supersonic;

    // Subscribe to all events BEFORE init() so we capture boot messages
    this.setupSupersonicCallbacks();

    // Initialize the engine
    try {
      await this.supersonic.init();
      this.updateConfig(this.supersonic.getInfo());
      this.setupScope();
    } catch (error) {
      console.error('[SuperSonicPanel] Initialization failed:', error);
    }
  },

  setupSupersonicCallbacks() {
    const sonic = this.supersonic;
    if (!sonic) return;

    // Subscribe to events
    this.unsubscribers = [
      sonic.on('debug', (msg) => this.appendLog('debug', msg.text)),
      sonic.on('message:sent', (data) => {
        const decoded = this.decodeOSC(data);
        if (decoded) {
          this.appendLog('oscOut', decoded);
        }
      }),
      sonic.on('message', (msg) => {
        const formatted = this.formatOSCMessage(msg);
        this.appendLog('oscIn', formatted);
      })
    ];

    // Poll metrics (v0.40+ uses pull-based getMetrics() instead of events)
    this.metricsInterval = setInterval(() => {
      try {
        const metrics = sonic.getMetrics();
        if (metrics) this.updateMetrics(metrics);
      } catch (_) {}
    }, 500);
  },

  teardownSupersonicCallbacks() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = null;
    }
  },

  // Scope visualization
  setupScope() {
    const sonic = this.supersonic;
    if (!sonic || !sonic.node) return;

    const audioCtx = sonic.node.context;
    if (!audioCtx) return;

    this.scopeCanvas = document.getElementById('supersonic-scope');
    if (!this.scopeCanvas) return;

    this.scopeCtx = this.scopeCanvas.getContext('2d');

    // Create analyser node
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect: node -> analyser -> destination
    // Note: node is already connected to destination, so we insert analyser in between
    sonic.node.disconnect();
    sonic.node.connect(this.analyser);
    this.analyser.connect(audioCtx.destination);

    this.drawScope();
  },

  drawScope() {
    this.scopeAnimationId = requestAnimationFrame(() => this.drawScope());

    if (!this.analyser || !this.scopeCanvas || !this.scopeCtx) return;

    // Get CSS dimensions
    const rect = this.scopeCanvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    // Skip if canvas not laid out yet
    if (width < 10 || height < 10) return;

    // Always sync canvas buffer size with CSS size
    this.scopeCanvas.width = width;
    this.scopeCanvas.height = height;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Clear to transparent
    this.scopeCtx.clearRect(0, 0, width, height);

    // Draw waveform
    this.scopeCtx.lineWidth = 1.5;
    this.scopeCtx.strokeStyle = '#f97316'; // orange-500
    this.scopeCtx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    // Sample fewer points for smoother line
    const step = Math.max(1, Math.floor(bufferLength / width));

    for (let i = 0; i < bufferLength; i += step) {
      // Center around 0 (-1 to +1 range), amplify for visibility
      const sample = (dataArray[i] - 128) / 128.0;
      // Noise gate - ignore tiny fluctuations
      const gated = Math.abs(sample) < 0.02 ? 0 : sample;
      const amplified = Math.max(-1, Math.min(1, gated * 4));
      const y = height / 2 - (amplified * height / 2);

      if (i === 0) {
        this.scopeCtx.moveTo(x, y);
      } else {
        this.scopeCtx.lineTo(x, y);
      }

      x += sliceWidth * step;
    }

    this.scopeCtx.lineTo(width, height / 2);
    this.scopeCtx.stroke();
  },

  stopScope() {
    if (this.scopeAnimationId) {
      cancelAnimationFrame(this.scopeAnimationId);
      this.scopeAnimationId = null;
    }
  },

  updateConfig(info) {
    if (!info) return;

    const fields = {
      sampleRate: info.sampleRate ? `${info.sampleRate} Hz` : '-',
      audioContextState: info.capabilities?.audioWorklet ? 'ready' : 'waiting',
      bootTimeMs: info.bootTimeMs ? `${info.bootTimeMs.toFixed(0)}ms` : '-',
      loadedSynthDefs: '-'
    };

    for (const [field, value] of Object.entries(fields)) {
      const el = document.querySelector(`#supersonic-config [data-field="${field}"]`);
      if (el) el.textContent = value;
    }
  },

  updateMetrics(metrics) {
    if (!metrics) return;

    const fields = {
      oscOutMessagesSent: metrics.oscOutMessagesSent ?? 0,
      oscInMessagesReceived: metrics.oscInMessagesReceived ?? 0,
      scsynthSchedulerDepth: metrics.scsynthSchedulerDepth ?? 0,
      scsynthSchedulerPeakDepth: metrics.scsynthSchedulerPeakDepth ?? 0,
      preschedulerPending: metrics.preschedulerPending ?? 0,
      preschedulerDispatched: metrics.preschedulerDispatched ?? 0,
      scsynthMessagesDropped: metrics.scsynthMessagesDropped ?? 0,
      scsynthSchedulerDropped: metrics.scsynthSchedulerDropped ?? 0,
      inBufferUsage: metrics.inBufferUsed?.percentage?.toFixed(1) + '%' ?? '0%',
      outBufferUsage: metrics.outBufferUsed?.percentage?.toFixed(1) + '%' ?? '0%',
      audioContextState: metrics.audioContextState ?? '-',
      loadedSynthDefs: metrics.loadedSynthDefs ?? 0
    };

    for (const [field, value] of Object.entries(fields)) {
      const el = document.querySelector(`#supersonic-metrics [data-field="${field}"], #supersonic-config [data-field="${field}"]`);
      if (el) el.textContent = value;
    }
  },

  appendLog(type, text) {
    const buffer = this.logBuffers[type];
    buffer.push(text);

    if (buffer.length > MAX_LOG_ENTRIES) {
      buffer.shift();
    }

    this.renderLog(type);
  },

  renderLog(type) {
    const elementId = {
      debug: 'supersonic-log-debug',
      oscOut: 'supersonic-log-osc-out',
      oscIn: 'supersonic-log-osc-in'
    }[type];

    const el = document.getElementById(elementId);
    if (!el) return;

    const buffer = this.logBuffers[type];
    if (buffer.length === 0) return;

    el.innerHTML = buffer
      .map(line => `<div>${this.escapeHtml(line)}</div>`)
      .join('');

    el.scrollTop = el.scrollHeight;

    // Also update tabbed content if in tabbed mode and this is active tab
    if (this.isTabbed && this.activeTab === type) {
      const tabbedContent = document.getElementById('supersonic-log-tabbed-content');
      if (tabbedContent) {
        tabbedContent.innerHTML = el.innerHTML;
        tabbedContent.scrollTop = tabbedContent.scrollHeight;
      }
    }
  },

  decodeOSC(data) {
    try {
      const sonic = window.supersonic;
      if (!sonic) return null;

      const decoded = sonic.constructor.osc.decode(data, { metadata: true });
      return this.formatOSCMessage(decoded);
    } catch (e) {
      return `[binary ${data.length} bytes]`;
    }
  },

  formatOSCMessage(msg) {
    if (!msg) return '[null]';

    if (msg.address) {
      const args = msg.args?.map(a => {
        let val = (typeof a === 'object' && a.value !== undefined) ? a.value : a;
        // Truncate large binary arrays (e.g. synthdef blobs)
        if (val instanceof Uint8Array && val.length > 32) {
          return `<${val.length} bytes>`;
        }
        return val;
      }) ?? [];

      const result = `${msg.address} ${args.join(' ')}`;
      // Truncate very long lines
      return result.length > 200 ? result.substring(0, 200) + '...' : result;
    }

    if (msg.packets) {
      return `#bundle [${msg.packets.length} msgs]`;
    }

    return JSON.stringify(msg);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  setupTabSwitching() {
    const tabs = this.el.querySelectorAll('.supersonic-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab button states
    const tabs = this.el.querySelectorAll('.supersonic-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.dataset.active = 'true';
      } else {
        delete tab.dataset.active;
      }
    });

    // Update tabbed content
    const tabbedContent = document.getElementById('supersonic-log-tabbed-content');
    if (!tabbedContent) return;

    const sourceId = {
      debug: 'supersonic-log-debug',
      'osc-out': 'supersonic-log-osc-out',
      'osc-in': 'supersonic-log-osc-in'
    }[tabName];

    const sourceEl = document.getElementById(sourceId);
    if (sourceEl) {
      tabbedContent.innerHTML = sourceEl.innerHTML;
      tabbedContent.scrollTop = tabbedContent.scrollHeight;
    }
  },

  setupLayoutMode() {
    this.handleResize();
  },

  handleResize() {
    const shouldBeTabbed = window.innerHeight < STACKED_MIN_HEIGHT;

    if (shouldBeTabbed === this.isTabbed) return;

    this.isTabbed = shouldBeTabbed;

    const stackedEl = document.getElementById('supersonic-logs-stacked');
    const tabbedEl = document.getElementById('supersonic-logs-tabbed');

    if (!stackedEl || !tabbedEl) return;

    if (shouldBeTabbed) {
      stackedEl.classList.add('hidden');
      tabbedEl.classList.remove('hidden');
      // Set initial active tab
      const firstTab = tabbedEl.querySelector('.supersonic-tab');
      if (firstTab) {
        this.switchTab(firstTab.dataset.tab);
      }
    } else {
      stackedEl.classList.remove('hidden');
      tabbedEl.classList.add('hidden');
    }
  },

  setupResize() {
    const handle = document.getElementById('supersonic-resize-handle');
    if (!handle) return;

    const onMouseDown = (e) => {
      e.preventDefault();
      this.isResizing = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!this.isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(this.panelMinWidth, Math.min(this.panelMaxWidth, newWidth));
      this.el.style.width = `${clamped}px`;
    };

    const onMouseUp = () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Save width to localStorage
      localStorage.setItem('supersonic-panel-width', parseInt(this.el.style.width));
    };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Store for cleanup
    this.resizeCleanup = () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }
};
