import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMetrics } from "../hooks/useMetrics";
import { useEvents } from "../hooks/useEvents";
import StatCard from "../components/StatCard";
import EventTable from "../components/EventTable";
import { PageSkeleton } from "../components/Loader";
import type { Event } from "../types";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: metricsData, isLoading: isLoadingMetrics } = useMetrics();
  const { eventsData, isLoadingEvents } = useEvents(1, 5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Update lastSynced whenever data arrives or changes
  useEffect(() => {
    if (metricsData) {
      setLastSynced(Date.now());
    }
  }, [metricsData]);

  // Keep track of sync time dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - lastSynced) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries();
    setLastSynced(Date.now());
    setIsRefreshing(false);
  };

  const getSyncText = () => {
    if (secondsAgo < 5) return "Synced just now";
    return `Synced ${secondsAgo}s ago`;
  };

  if (isLoadingMetrics || isLoadingEvents) {
    return <PageSkeleton />;
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
      {/* Top Header Row with Title and Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans">Dashboard</h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Overview of event delivery performance, latency, and status.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 font-medium tabular-nums select-none">
            {getSyncText()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2 px-4 rounded-md text-xs cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none border border-zinc-300"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
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
      <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg text-zinc-50 flex items-center gap-2.5 font-semibold">
            <Send size={18} />
            <span>Recent Events Stream</span>
          </h3>
          <Link
            to="/events"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-all duration-150 border border-zinc-700 font-medium"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {eventsList.length > 0 ? (
          <EventTable events={eventsList.slice(0, 5)} />
        ) : (
          <div className="text-zinc-500 text-sm py-4">No recent events recorded.</div>
        )}
      </div>
    </div>
  );
}
