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
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in-95 duration-300 z-10">
          <div className="h-14 w-14 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shadow-inner shadow-white/5">
            <CheckCircle2 size={28} className="text-indigo-400" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-50 font-display">
              Registration Received
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed px-4">
              Your account registration has been successfully received and is currently pending administrator review.
            </p>
          </div>

          <div className="w-full p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 text-xs text-zinc-400 leading-relaxed text-center flex flex-col gap-2 shadow-inner">
            <p className="font-semibold text-zinc-200">What happens next?</p>
            <p className="text-[11px] text-zinc-400 font-medium">
              A system administrator is reviewing pending activations. You will be granted workspace access once approved. Please contact your system administrator if you require immediate approval.
            </p>
          </div>

          <Link
            to="/login"
            className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative font-sans">
      {/* Decorative Radial glow background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Main Container */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 z-10">
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-indigo-400 shadow-inner shadow-white/5">
            <KeyRound size={22} />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-50 font-display">
              Create an Account
            </h1>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[280px]">
              Join the Webhooks & Real-time Event Delivery Hub
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="developer@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950/60 border border-zinc-800 px-4 py-2.5 rounded-xl text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 placeholder-zinc-700 transition-all duration-200"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Sign Up</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-zinc-50 hover:text-indigo-400 hover:underline font-semibold transition-colors">
            Connect here
          </Link>
        </div>

      </div>
    </div>
  );
}
