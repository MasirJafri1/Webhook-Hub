import { useState } from "react";
import { AlertOctagon, RefreshCw, Skull, Bug } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import EventTable from "../components/EventTable";
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
  } = useEvents();

  const [activeTab, setActiveTab] = useState<"dead" | "poisoned">("dead");

  if (isLoadingDead || isLoadingPoisoned) {
    return <div className="text-text-muted text-sm p-8">Loading Dead Letter Queues...</div>;
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

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg text-zinc-50 flex items-center gap-2.5 font-semibold">
            <AlertOctagon size={18} className="text-red-400" />
            <span>Dead Letter Queue (DLQ) & Poisoned Events</span>
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
          Events are marked as <strong>Poisoned</strong> if their payload could not be parsed, signature verification failed, or another unrecoverable validation error occurred.
        </p>

        {/* Tab Selection */}
        <div className="flex gap-3 border-b border-border-color pb-3">
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
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === "dead" ? (
            <EventTable events={deadList} onReplay={replayEvent} />
          ) : (
            <EventTable events={poisonedList} onReplay={replayEvent} />
          )}
        </div>
      </div>
    </div>
  );
}
