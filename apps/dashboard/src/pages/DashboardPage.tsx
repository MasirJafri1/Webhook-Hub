import { Link } from "react-router-dom";
import {
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useMetrics } from "../hooks/useMetrics";
import { useEvents } from "../hooks/useEvents";
import StatCard from "../components/StatCard";
import EventTable from "../components/EventTable";
import type { Event } from "../types";

export default function DashboardPage() {
  const { data: metricsData, isLoading: isLoadingMetrics } = useMetrics();
  const { eventsData, isLoadingEvents } = useEvents(1, 5);

  if (isLoadingMetrics || isLoadingEvents) {
    return <div className="text-text-muted text-sm p-8">Loading dashboard...</div>;
  }

  const overview = metricsData?.overview || { total: 0, success: 0, failed: 0 };
  const dead = metricsData?.dead || { dead: 0 };

  const successRate =
    overview.total > 0 ? ((overview.success / overview.total) * 100).toFixed(1) : "0.0";

  // Safely cast/assert events data array
  let eventsList: Event[] = [];
  if (eventsData) {
    if (Array.isArray(eventsData)) {
      eventsList = eventsData;
    } else if (eventsData.data && Array.isArray(eventsData.data)) {
      eventsList = eventsData.data;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Events"
          value={overview.total}
          icon={<Send size={20} />}
          theme="primary"
        />
        <StatCard
          title="Success Deliveries"
          value={overview.success}
          icon={<CheckCircle size={20} />}
          trend={`${successRate}% Success`}
          theme="success"
        />
        <StatCard
          title="Failed Deliveries"
          value={overview.failed}
          icon={<XCircle size={20} />}
          theme="error"
        />
        <StatCard
          title="Dead Letter Queue"
          value={dead.dead}
          icon={<AlertTriangle size={20} />}
          theme="warning"
        />
      </div>

      {/* Recent Events Section */}
      <div className="p-6 flex flex-col gap-5 glass-panel">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-semibold">
            <Send size={18} />
            <span>Recent Events Stream</span>
          </h3>
          <Link
            to="/events"
            className="bg-gradient-to-r from-accent-primary to-accent-info text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {eventsList.length > 0 ? (
          <EventTable events={eventsList.slice(0, 5)} />
        ) : (
          <div className="text-text-muted text-sm py-4">No recent events recorded.</div>
        )}
      </div>
    </div>
  );
}
