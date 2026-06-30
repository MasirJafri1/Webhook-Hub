import { useState } from "react";
import { AlertOctagon, RefreshCw, Skull, Bug, Calendar, ChevronRight } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import EventTable from "../components/EventTable";
import EventDetailDrawer from "../components/EventDetailDrawer";
import { TableSkeleton } from "../components/Loader";
import type { Event } from "../types";

export default function DeadLetterPage() {
  const {
    deadEvents,
    isLoadingDead,
    poisonedEvents,
    isLoadingPoisoned,
    replayEvent,
    replayAllEvents,
    isReplayingAll,
    replayWindow,
    isReplayingWindow,
  } = useEvents();

  const [activeTab, setActiveTab] = useState<"dead" | "poisoned" | "window">("dead");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Replay window state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [windowResult, setWindowResult] = useState<string | null>(null);

  if (isLoadingDead || isLoadingPoisoned) {
    return (
      <div className="flex flex-col gap-8 w-full animate-pulse">
        <div className="h-32 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl" />
        <TableSkeleton cols={7} rows={5} />
      </div>
    );
  }

  const deadList: Event[] = Array.isArray(deadEvents) ? deadEvents : [];
  const poisonedList: Event[] = Array.isArray(poisonedEvents) ? poisonedEvents : [];

  const handleReplayAll = async () => {
    if (deadList.length === 0 && poisonedList.length === 0) return;
    try {
      await replayAllEvents();
      alert("Successfully queued all dead/poisoned events for replay.");
    } catch (err) {
      console.error(err);
      alert("Failed to replay all events.");
    }
  };

  const handleReplayWindow = async () => {
    if (!fromDate || !toDate) return;
    try {
      setWindowResult(null);
      await replayWindow({ from: fromDate, to: toDate });
      setWindowResult(`✅ Successfully queued events from ${fromDate} to ${toDate} for replay.`);
    } catch (err) {
      console.error(err);
      setWindowResult("❌ Failed to replay events in window.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 flex flex-col gap-4 glass-panel">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
          <h3 className="text-lg text-zinc-50 flex items-center gap-2.5 font-semibold">
            <AlertOctagon size={18} className="text-red-400" />
            <span>Dead Letter Queue & Poisoned Events</span>
          </h3>
          <button
            onClick={handleReplayAll}
            disabled={isReplayingAll || (deadList.length === 0 && poisonedList.length === 0)}
            className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-lg font-semibold cursor-pointer flex items-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isReplayingAll ? "animate-spin" : ""} />
            <span>{isReplayingAll ? "Replaying All..." : "Replay All Events"}</span>
          </button>
        </div>
        <p className="text-text-muted text-sm leading-relaxed mb-2">
          Events are moved to the <strong>Dead Letter Queue</strong> when they exceed maximum retry thresholds (5 attempts).
          Events are marked as <strong>Poisoned</strong> if their payload could not be parsed or another unrecoverable error occurred.
        </p>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 border-b border-border-color pb-3">
          <button
            onClick={() => setActiveTab("dead")}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
              activeTab === "dead"
                ? "text-text-main border-accent-error font-bold"
                : "text-text-muted border-transparent hover:text-text-main"
            }`}
          >
            <Skull size={16} className={activeTab === "dead" ? "text-accent-error" : "text-text-muted"} />
            <span>Dead Events ({deadList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("poisoned")}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
              activeTab === "poisoned"
                ? "text-text-main border-accent-warning font-bold"
                : "text-text-muted border-transparent hover:text-text-main"
            }`}
          >
            <Bug size={16} className={activeTab === "poisoned" ? "text-accent-warning" : "text-text-muted"} />
            <span>Poisoned Events ({poisonedList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("window")}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm cursor-pointer transition-all duration-200 border-b-2 ${
              activeTab === "window"
                ? "text-text-main border-indigo-500 font-bold"
                : "text-text-muted border-transparent hover:text-text-main"
            }`}
          >
            <Calendar size={16} className={activeTab === "window" ? "text-indigo-400" : "text-text-muted"} />
            <span>Replay Window</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === "dead" && (
            <EventTable events={deadList} onReplay={replayEvent} onRowClick={setSelectedEvent} />
          )}
          {activeTab === "poisoned" && (
            <EventTable events={poisonedList} onReplay={replayEvent} onRowClick={setSelectedEvent} />
          )}
          {activeTab === "window" && (
            <div className="flex flex-col gap-5 max-w-lg">
              <p className="text-sm text-text-muted leading-relaxed">
                Re-queue all <strong className="text-text-main">dead or failed</strong> events that were created within a specific date range for re-delivery.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">From Date</label>
                  <input
                    type="datetime-local"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">To Date</label>
                  <input
                    type="datetime-local"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleReplayWindow}
                disabled={isReplayingWindow || !fromDate || !toDate}
                className="self-start flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={15} className={isReplayingWindow ? "animate-spin" : ""} />
                <span>{isReplayingWindow ? "Replaying…" : "Replay Events in Window"}</span>
                {!isReplayingWindow && <ChevronRight size={15} />}
              </button>
              {windowResult && (
                <p className="text-sm font-medium text-text-main bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  {windowResult}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Drawer */}
      {selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReplay={replayEvent}
        />
      )}
    </div>
  );
}
