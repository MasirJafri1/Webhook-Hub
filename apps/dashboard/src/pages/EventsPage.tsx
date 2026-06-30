import { useState } from "react";
import { Send } from "lucide-react";
import { useEvents } from "../hooks/useEvents";
import EventTable from "../components/EventTable";
import EventDetailDrawer from "../components/EventDetailDrawer";
import { TableSkeleton } from "../components/Loader";
import type { Event } from "../types";

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { eventsData, isLoadingEvents, replayEvent } = useEvents(page, limit);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  if (isLoadingEvents) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-2 pb-5 border-b border-zinc-800/60 animate-pulse">
          <div className="h-6 w-48 bg-zinc-800 rounded" />
          <div className="h-3 w-80 bg-zinc-800/60 rounded mt-1" />
        </div>
        <TableSkeleton cols={7} rows={10} />
      </div>
    );
  }

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
        <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
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

        <p className="text-xs text-text-dim -mt-2">
          Click any row to view the event payload, delivery timeline, and replay options.
        </p>

        <EventTable events={events} onReplay={replayEvent} onRowClick={setSelectedEvent} />

        {isPaginated && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border-color/40 flex-wrap gap-3">
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
