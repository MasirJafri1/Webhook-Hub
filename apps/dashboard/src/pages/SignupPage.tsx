import React, { useState } from "react";
import { KeyRound, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/signup", {
        email: email.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "Failed to sign up. Make sure your local API worker is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090A0F] text-white p-4 relative overflow-hidden font-sans">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl relative flex flex-col gap-6 items-center text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-display">
              Registration Received!
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed px-4">
              Your account has been successfully registered and is currently **pending approval**.
            </p>
          </div>

          <div className="w-full p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs text-slate-400 leading-relaxed text-left flex flex-col gap-2">
            <p className="font-semibold text-slate-300">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Log in using the Super Admin account (<code className="text-cyan-400">admin@webhook.com</code>).</li>
              <li>Go to the **Admin Panel** tab in the sidebar.</li>
              <li>Locate your email <code className="text-cyan-400">{email}</code> and click **Approve**.</li>
            </ol>
          </div>

          <Link
            to="/login"
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
              Create an Account
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              Join the Webhooks & Event Delivery Hub
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="developer@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-lg text-white text-sm tracking-wide transition-all focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] placeholder-slate-600"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>Sign Up</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
            Connect here
          </Link>
        </div>

      </div>
    </div>
  );
}
