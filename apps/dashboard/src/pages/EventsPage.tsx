import { useState } from "react";
import { Send } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import EventTable from "../components/EventTable";
import type { Event } from "../types";

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { eventsData, isLoadingEvents, replayEvent } = useEvents(page, limit);

  if (isLoadingEvents) {
    return <div className="text-text-muted text-sm p-8">Loading events stream...</div>;
  }

  // Safe checks: since backend can return array (non-paginated fallback) or object (paginated).
  const isPaginated = eventsData && !Array.isArray(eventsData) && "data" in eventsData;
  
  let events: Event[] = [];
  if (eventsData) {
    if (Array.isArray(eventsData)) {
      events = eventsData;
    } else if ("data" in eventsData && Array.isArray(eventsData.data)) {
      events = eventsData.data;
    }
  }

  const total = isPaginated && typeof eventsData === "object" && "total" in eventsData ? eventsData.total : events.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-8">
      <div className="p-6 flex flex-col gap-5 glass-panel">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-semibold">
            <Send size={18} />
            <span>Recorded Webhook Events</span>
          </h3>
          <div className="flex flex-col gap-2 w-[140px]">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="bg-white/[0.03] border border-border-color px-3 py-2 rounded-lg text-text-main text-xs transition-all focus:outline-none focus:border-accent-primary"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        <EventTable events={events} onReplay={replayEvent} />

        {isPaginated && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border-color/40">
            <span className="text-xs text-text-muted">
              Showing page {page} of {totalPages} (Total: {total} events)
            </span>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="bg-bg-card border border-border-color text-text-main px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:border-accent-primary hover:bg-bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="bg-bg-card border border-border-color text-text-main px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 hover:border-accent-primary hover:bg-bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
