import React, { useState } from "react";
import { Plus, Webhook as WebhookIcon } from "lucide-react";
import { useWebhooks } from "../hooks/useWebhooks";
import WebhookTable from "../components/WebhookTable";

export default function WebhooksPage() {
  const { data: webhooks, isLoading, createWebhook, deleteWebhook, rotateSecret } = useWebhooks();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rpm, setRpm] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      setIsSubmitting(true);
      await createWebhook({
        name,
        url,
        requestsPerMinute: parseInt(rpm, 10) || 60,
      });
      setName("");
      setUrl("");
      setRpm("60");
    } catch (err) {
      console.error(err);
      alert("Failed to create webhook endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-text-muted text-sm p-8">Loading webhook configurations...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Register Section */}
      <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900 rounded-lg">
        <h3 className="text-lg text-zinc-50 flex items-center gap-2 font-semibold">
          <WebhookIcon size={18} />
          <span>Register New Webhook Endpoint</span>
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Endpoint Name</label>
            <input
              type="text"
              placeholder="e.g. Stripe Sync"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Target URL</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Limit (RPM)</label>
            <input
              type="number"
              min="1"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-lg text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={16} />
            <span>{isSubmitting ? "Adding..." : "Add Endpoint"}</span>
          </button>
        </form>
      </div>

      {/* Webhook Table Section */}
      <div className="flex flex-col gap-6">
        <WebhookTable
          webhooks={webhooks || []}
          onDelete={deleteWebhook}
          onRotateSecret={rotateSecret}
        />
      </div>
    </div>
  );
}
