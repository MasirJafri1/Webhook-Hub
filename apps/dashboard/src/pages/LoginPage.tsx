import React, { useState } from "react";
import { KeyRound, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import axios from "axios";

interface LoginPageProps {
  onLoginSuccess: (apiKey: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsLoading(true);
    setError("");

    // Minimal validation to verify format
    if (!apiKey.startsWith("whpk_")) {
      setError("Invalid API Key format. Should start with 'whpk_'.");
      setIsLoading(false);
      return;
    }

    localStorage.setItem("whpk_api_key", apiKey.trim());
    onLoginSuccess(apiKey.trim());
  };

  const handleSeedKey = async () => {
    setIsSeeding(true);
    setError("");
    try {
      const res = await axios.post<{ apiKey: string }>("http://localhost:8790/test/seed");
      const key = res.data.apiKey;
      localStorage.setItem("whpk_api_key", key);
      onLoginSuccess(key);
    } catch (err) {
      console.error(err);
      setError("Failed to seed a dev credential from the API worker. Make sure your local API worker is running.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090A0F] text-white p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl relative flex flex-col gap-6">
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <KeyRound size={24} className="text-white" />
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-display">
              Connect to Webhooks
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Developer Portal & Event Delivery Dashboard
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleConnect} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project API Key
            </label>
            <input
              type="password"
              placeholder="whpk_live_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-lg text-white text-sm tracking-wide transition-all focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] placeholder-slate-600"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs leading-relaxed">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isSeeding}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>Connect Dashboard</span>
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] grow bg-white/[0.08]" />
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Or Quick Start
          </span>
          <div className="h-[1px] grow bg-white/[0.08]" />
        </div>

        {/* Seed Credentials Button */}
        <button
          type="button"
          onClick={handleSeedKey}
          disabled={isLoading || isSeeding}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isSeeding ? (
            <Loader2 size={16} className="animate-spin text-cyan-400" />
          ) : (
            <Sparkles size={16} className="text-cyan-400" />
          )}
          <span>Seed Test Credentials & Login</span>
        </button>

        <p className="text-[10px] text-center text-slate-500 leading-normal">
          Clicking "Seed Test Credentials" sends a query to your local D1 database to instantiate a dummy organization, project, and developer token for testing.
        </p>

      </div>
    </div>
  );
}
