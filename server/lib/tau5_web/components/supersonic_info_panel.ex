defmodule Tau5Web.Components.SuperSonicInfoPanel do
  @moduledoc """
  Dashboard panel showing SuperSonic engine state.

  Displays:
  - Config/info (sample rate, boot time, state)
  - Live metrics (message counts, scheduler stats, buffer usage)
  - Debug log (scsynth info messages)
  - OSC sent/received logs

  All dynamic content is rendered client-side by the JS hook.
  The LiveComponent only manages visibility state.
  """

  use Tau5Web, :live_component

  @impl true
  def mount(socket) do
    {:ok, assign(socket, :visible, false)}
  end

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id="supersonic-info-panel"
      phx-hook="SuperSonicPanel"
      class={[
        "fixed top-0 right-0 h-full z-50",
        "transform transition-transform duration-300 ease-out",
        "flex flex-col",
        "bg-black/60 backdrop-blur-md border-l border-white/10",
        "font-mono text-sm text-white/90",
        @visible && "translate-x-0" || "translate-x-full"
      ]}
      style="width: 384px;"
    >
      <!-- Resize handle -->
      <div
        id="supersonic-resize-handle"
        class="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-50 hover:bg-orange-500/30"
      />
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span class="text-xs font-bold tracking-widest uppercase text-white/80">
          SuperSonic
        </span>
        <button
          phx-click="toggle_panel"
          phx-target={@myself}
          class="text-white/60 hover:text-white/90 transition-colors"
          title="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Scope -->
      <div class="py-1 border-b border-white/10">
        <canvas
          id="supersonic-scope"
          class="w-full"
          style="height: 40px;"
        />
      </div>

      <!-- Metrics (compact) -->
      <div id="supersonic-metrics" phx-update="ignore" class="px-3 py-2 border-b border-white/10 text-xs flex flex-wrap gap-x-4 gap-y-1">
        <span><span class="text-white/40">sent:</span> <span data-field="oscOutMessagesSent" class="text-amber-400">0</span></span>
        <span><span class="text-white/40">recv:</span> <span data-field="oscInMessagesReceived" class="text-amber-400">0</span></span>
        <span><span class="text-white/40">sched:</span> <span data-field="scsynthSchedulerDepth" class="text-emerald-400">0</span>/<span data-field="scsynthSchedulerPeakDepth" class="text-emerald-400">0</span></span>
        <span><span class="text-white/40">pre:</span> <span data-field="preschedulerPending" class="text-sky-400">0</span>/<span data-field="preschedulerDispatched" class="text-sky-400">0</span></span>
        <span><span class="text-white/40">drop:</span> <span data-field="scsynthMessagesDropped" class="text-rose-400">0</span>/<span data-field="scsynthSchedulerDropped" class="text-rose-400">0</span></span>
        <span><span class="text-white/40">buf:</span> <span data-field="inBufferUsage" class="text-violet-400">0%</span>/<span data-field="outBufferUsage" class="text-violet-400">0%</span></span>
      </div>

      <!-- Log Sections Container -->
      <div id="supersonic-logs-container" phx-update="ignore" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Stacked mode (default) -->
        <div id="supersonic-logs-stacked" class="flex-1 flex flex-col min-h-0">
          <!-- Debug Log -->
          <div class="flex-1 min-h-0 overflow-hidden border-b border-white/10 relative">
            <span class="absolute top-1 right-2 text-[10px] uppercase tracking-wider text-white/30 bg-black/20 px-1 z-10">
              scsynth
            </span>
            <div
              id="supersonic-log-debug"
              class="h-full overflow-y-auto px-3 py-2 text-xs text-amber-400/90 font-mono leading-tight"
            >
            </div>
          </div>

          <!-- OSC Out Log -->
          <div class="flex-1 min-h-0 overflow-hidden border-b border-white/10 relative">
            <span class="absolute top-1 right-2 text-[10px] uppercase tracking-wider text-white/30 bg-black/20 px-1 z-10">
              osc out
            </span>
            <div
              id="supersonic-log-osc-out"
              class="h-full overflow-y-auto px-3 py-2 text-xs text-white/70 font-mono leading-tight"
            >
            </div>
          </div>

          <!-- OSC In Log -->
          <div class="flex-1 min-h-0 overflow-hidden relative">
            <span class="absolute top-1 right-2 text-[10px] uppercase tracking-wider text-white/30 bg-black/20 px-1 z-10">
              osc in
            </span>
            <div
              id="supersonic-log-osc-in"
              class="h-full overflow-y-auto px-3 py-2 text-xs text-white/70 font-mono leading-tight"
            >
            </div>
          </div>
        </div>

        <!-- Tabbed mode (for short viewports) - hidden by default, shown via JS -->
        <div id="supersonic-logs-tabbed" class="hidden flex-1 flex flex-col min-h-0">
          <div class="flex border-b border-white/10 shrink-0">
            <button
              data-tab="debug"
              class="supersonic-tab px-4 py-2 text-xs font-bold tracking-wider uppercase text-white/50 hover:text-white/80 border-b-2 border-transparent data-[active]:border-amber-400 data-[active]:text-white/90"
            >
              Info
            </button>
            <button
              data-tab="osc-out"
              class="supersonic-tab px-4 py-2 text-xs font-bold tracking-wider uppercase text-white/50 hover:text-white/80 border-b-2 border-transparent data-[active]:border-amber-400 data-[active]:text-white/90"
            >
              OSC Out
            </button>
            <button
              data-tab="osc-in"
              class="supersonic-tab px-4 py-2 text-xs font-bold tracking-wider uppercase text-white/50 hover:text-white/80 border-b-2 border-transparent data-[active]:border-amber-400 data-[active]:text-white/90"
            >
              OSC In
            </button>
          </div>
          <div
            id="supersonic-log-tabbed-content"
            class="flex-1 overflow-y-auto px-4 py-2 text-xs text-white/70 font-mono"
          >
          </div>
        </div>
      </div>
    </div>
    """
  end

  @impl true
  def handle_event("toggle_panel", _, socket) do
    {:noreply, assign(socket, :visible, !socket.assigns.visible)}
  end
end
