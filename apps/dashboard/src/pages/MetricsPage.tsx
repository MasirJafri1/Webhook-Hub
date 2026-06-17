import { useState, useEffect } from "react";
import { BarChart2, Clock, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMetrics } from "../hooks/useMetrics";
import { useDeliveries } from "../hooks/useDeliveries";
import StatCard from "../components/StatCard";
import MetricTable from "../components/MetricTable";
import { PageSkeleton } from "../components/Loader";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ChartBucket {
  time: string;
  success: number;
  failed: number;
  latencyTotal: number;
  latencyCount: number;
}

interface ProcessedChartItem {
  time: string;
  Success: number;
  Failed: number;
  Latency: number;
}

export default function MetricsPage() {
  const queryClient = useQueryClient();
  const { data: metricsData, isLoading: isLoadingMetrics } = useMetrics();
  const { deliveries, isLoadingDeliveries } = useDeliveries();
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

  if (isLoadingMetrics || isLoadingDeliveries) {
    return <PageSkeleton />;
  }

  // Backend response fallbacks
  const overview = metricsData?.overview || { total: 0, success: 0, failed: 0 };
  const dead = metricsData?.dead || { dead: 0 };
  const latency = metricsData?.latency || { avg_latency: 0 };
  const retry = metricsData?.retry || { average_retry: 0, max_retry: 0 };
  const endpointHealth = metricsData?.endpointHealth || [];

  const successRate =
    overview.total > 0 ? ((overview.success / overview.total) * 100).toFixed(1) : "0.0";

  // Process deliveries for time-series charts
  const sortedDeliveries = [...(deliveries || [])].sort((a, b) => a.createdAt - b.createdAt);
  
  const groupedData = sortedDeliveries.reduce<ChartBucket[]>((acc, d) => {
    const timeLabel = new Date(d.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let bucket = acc.find((b) => b.time === timeLabel);
    if (!bucket) {
      bucket = { time: timeLabel, success: 0, failed: 0, latencyTotal: 0, latencyCount: 0 };
      acc.push(bucket);
    }

    if (d.status === "success") {
      bucket.success += 1;
    } else {
      bucket.failed += 1;
    }

    if (d.latencyMs !== null && d.latencyMs !== undefined) {
      bucket.latencyTotal += d.latencyMs;
      bucket.latencyCount += 1;
    }

    return acc;
  }, []);

  const chartData: ProcessedChartItem[] = groupedData.map((b) => ({
    time: b.time,
    Success: b.success,
    Failed: b.failed,
    Latency: b.latencyCount > 0 ? Math.round(b.latencyTotal / b.latencyCount) : 0,
  })).slice(-15); // Show last 15 active time buckets

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header Row with Title and Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans">Metrics & Analytics</h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Detailed view of webhook delivery latency, volume time-series, and endpoint health.
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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Success Rate"
          value={`${successRate}%`}
          trend={`${overview.success} of ${overview.total} attempts`}
          icon={<CheckCircle size={20} />}
          theme="success"
        />
        <StatCard
          title="Average Latency"
          value={`${Math.round(latency.avg_latency)} ms`}
          icon={<Clock size={20} />}
          theme="primary"
        />
        <StatCard
          title="Avg Retries / Max"
          value={`${retry.average_retry.toFixed(1)} / ${retry.max_retry}`}
          icon={<BarChart2 size={20} />}
          theme="primary"
        />
        <StatCard
          title="Undelivered (DLQ)"
          value={dead.dead}
          icon={<AlertTriangle size={20} />}
          theme="warning"
        />
      </div>

      {/* Recharts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 flex flex-col gap-5 glass-panel">
          <h4 className="font-display text-base font-semibold text-text-main flex items-center gap-2">
            <BarChart2 size={16} />
            <span>Delivery Performance Trends</span>
          </h4>
          <div className="h-80 w-full">
            {chartData.length === 0 ? (
              <div className="flex justify-center items-center h-full text-text-muted text-sm">
                No active delivery logs found. Send webhooks to visualize data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-sidebar)",
                      borderColor: "var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-main)",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="Success"
                    stroke="var(--accent-success)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent-success)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Failed"
                    stroke="var(--accent-error)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent-error)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5 glass-panel">
          <h4 className="font-display text-base font-semibold text-text-main flex items-center gap-2">
            <Clock size={16} />
            <span>Average Delivery Latency (ms)</span>
          </h4>
          <div className="h-80 w-full">
            {chartData.length === 0 ? (
              <div className="flex justify-center items-center h-full text-text-muted text-sm">
                No latency records available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-info)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-info)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-sidebar)",
                      borderColor: "var(--border-color)",
                      borderRadius: "8px",
                      color: "var(--text-main)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Latency"
                    stroke="var(--accent-info)"
                    fillOpacity={1}
                    fill="url(#colorLatency)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down section */}
      <div className="p-6 flex flex-col gap-5 glass-panel">
        <h4 className="font-display text-base font-semibold text-text-main flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Endpoint Health Breakdowns</span>
        </h4>
        <MetricTable metrics={endpointHealth} />
      </div>
    </div>
  );
}
