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
      <div className="p-6 flex flex-col gap-5 glass-panel">
        <h3 className="font-display text-xl text-text-main flex items-center gap-2.5 font-semibold">
          <WebhookIcon size={18} />
          <span>Register New Webhook Endpoint</span>
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-text-muted">Endpoint Name</label>
            <input
              type="text"
              placeholder="e.g. Stripe Sync"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.03] border border-border-color px-4 py-3 rounded-lg text-text-main text-sm transition-all focus:outline-none focus:border-accent-primary focus:bg-white/[0.05]"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-text-muted">Target URL</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/[0.03] border border-border-color px-4 py-3 rounded-lg text-text-main text-sm transition-all focus:outline-none focus:border-accent-primary focus:bg-white/[0.05]"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase text-text-muted">Limit (RPM)</label>
            <input
              type="number"
              min="1"
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              className="bg-white/[0.03] border border-border-color px-4 py-3 rounded-lg text-text-main text-sm transition-all focus:outline-none focus:border-accent-primary focus:bg-white/[0.05]"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-accent-primary to-accent-info text-white border-none px-6 py-3 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
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
