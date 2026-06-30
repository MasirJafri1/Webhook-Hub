import React, { useState } from "react";
import { Plus, Webhook as WebhookIcon } from "lucide-react";
import { useWebhooks } from "../hooks/useWebhooks";
import { useAuthMe } from "../hooks/useAuthMe";
import WebhookTable from "../components/WebhookTable";
import WebhookDetailDrawer from "../components/WebhookDetailDrawer";
import SecretRevealModal from "../components/SecretRevealModal";
import { TableSkeleton } from "../components/Loader";

export default function WebhooksPage() {
  const { data: webhooks, isLoading, createWebhook, deleteWebhook, rotateSecret } = useWebhooks();
  const { isAdmin } = useAuthMe();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [rpm, setRpm] = useState("60");
  const [version, setVersion] = useState<"v1" | "v2">("v1");
  const [eventFilters, setEventFilters] = useState("");
  const [customHeaders, setCustomHeaders] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Drawer & modal state
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      setIsSubmitting(true);
      
      let headersObj: Record<string, string> | undefined = undefined;
      if (customHeaders.trim()) {
        try {
          headersObj = JSON.parse(customHeaders.trim());
        } catch (err) {
          alert("Invalid Custom Headers JSON format. Please verify it is a valid JSON object.");
          setIsSubmitting(false);
          return;
        }
      }

      const filtersArray = eventFilters.trim()
        ? eventFilters.split(",").map(f => f.trim()).filter(Boolean)
        : undefined;

      const createdWebhook = await createWebhook({
        name,
        url,
        requestsPerMinute: parseInt(rpm, 10) || 60,
        version,
        eventFilters: filtersArray,
        customHeaders: headersObj,
      });

      setName("");
      setUrl("");
      setRpm("60");
      setEventFilters("");
      setCustomHeaders("");
      setVersion("v1");
      setShowCreateForm(false);

      // Show the secret immediately — it's only available at creation time
      if (createdWebhook?.currentSecret) {
        setRevealedSecret(createdWebhook.currentSecret);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create webhook endpoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 w-full animate-pulse">
        <div className="h-32 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl" />
        <TableSkeleton cols={6} rows={5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Register Section */}
      <div className="p-6 flex flex-col gap-4 border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-xl z-10 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-zinc-50 flex items-center gap-2.5 font-bold font-display">
            <WebhookIcon size={18} className="text-indigo-400" />
            <span>Webhook Endpoints</span>
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-2 transition-all duration-200 active:scale-[0.98] text-sm"
            >
              <Plus size={14} />
              <span>{showCreateForm ? "Cancel" : "New Endpoint"}</span>
            </button>
          )}
        </div>
        {isAdmin && showCreateForm ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 border-t border-zinc-800/60 pt-4 mt-1 animate-in slide-in-from-top-2 duration-300">
          {/* Row 1: Core Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Endpoint Name</label>
              <input
                type="text"
                placeholder="e.g. Stripe Sync"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target URL</label>
              <input
                type="url"
                placeholder="https://api.yourdomain.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Limit (RPM)</label>
                <input
                  type="number"
                  min="1"
                  value={rpm}
                  onChange={(e) => setRpm(e.target.value)}
                  className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">API Version</label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as "v1" | "v2")}
                  className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 cursor-pointer"
                >
                  <option value="v1">v1 (Default)</option>
                  <option value="v2">v2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Rules (Event Filters & Custom Headers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Subscribed Event Rules (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="order.placed, payment.succeeded (Leave empty for all events)"
                value={eventFilters}
                onChange={(e) => setEventFilters(e.target.value)}
                className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Custom Headers (JSON Object)
              </label>
              <input
                type="text"
                placeholder='e.g. {"Authorization": "Token secret", "X-Key": "Val"}'
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                className="bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200 font-mono text-xs"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 px-6 py-2.5 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus size={16} />
              <span>{isSubmitting ? "Adding..." : "Add Endpoint"}</span>
            </button>
          </div>
        </form>
        ) : !isAdmin ? (
          <div className="flex flex-col items-center gap-1.5 py-4 border border-dashed border-zinc-800/40 rounded-xl bg-zinc-950/10 text-center">
            <span className="text-zinc-500 text-xs font-semibold">🔒 You must be an administrator to register new webhook endpoints.</span>
          </div>
        ) : null}
        <p className="text-xs text-text-dim mt-2">
          Click any row in the table below to view details, per-endpoint metrics, and manage the signing secret.
        </p>
      </div>

      {/* Webhook Table Section */}
      <div className="flex flex-col gap-6">
        <WebhookTable
          webhooks={webhooks || []}
          onDelete={deleteWebhook}
          onRotateSecret={rotateSecret}
          onRowClick={(id) => setSelectedWebhookId(id)}
          onSecretRevealed={(secret) => setRevealedSecret(secret)}
        />
      </div>

      {/* Drawer */}
      {selectedWebhookId && (
        <WebhookDetailDrawer
          webhookId={selectedWebhookId}
          onClose={() => setSelectedWebhookId(null)}
          onDelete={deleteWebhook}
          onRotateSecret={rotateSecret}
          onSecretRevealed={(secret) => {
            setSelectedWebhookId(null);
            setRevealedSecret(secret);
          }}
        />
      )}

      {/* Secret Reveal Modal */}
      {revealedSecret && (
        <SecretRevealModal
          secret={revealedSecret}
          onClose={() => setRevealedSecret(null)}
        />
      )}
    </div>
  );
}
