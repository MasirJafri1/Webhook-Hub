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
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-50 p-4 relative font-sans">
        <div className="w-full max-w-md p-8 rounded-lg border border-zinc-800 bg-zinc-900 shadow-md relative flex flex-col gap-6 items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="h-14 w-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-zinc-100" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50">
              Registration Received!
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed px-4">
              Your account has been successfully registered and is currently **pending approval**.
            </p>
          </div>

          <div className="w-full p-4 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-400 leading-relaxed text-left flex flex-col gap-2">
            <p className="font-semibold text-zinc-200">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Log in using the Super Admin account (<code className="text-zinc-300">admin@webhook.com</code>).</li>
              <li>Go to the **Admin Panel** tab in the sidebar.</li>
              <li>Locate your email <code className="text-zinc-300">{email}</code> and click **Approve**.</li>
            </ol>
          </div>

          <Link
            to="/login"
            className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 px-4 rounded-md cursor-pointer flex items-center justify-center transition-all duration-150"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-50 p-4 relative font-sans">
      {/* Main Container */}
      <div className="w-full max-w-md p-8 rounded-lg border border-zinc-800 bg-zinc-900 shadow-md relative flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-10 w-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-50">
            <KeyRound size={20} />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 font-sans">
              Create an Account
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Join the Webhooks & Event Delivery Hub
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="developer@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 rounded-lg text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 rounded-lg text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs leading-relaxed">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 px-4 rounded-md cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Sign Up</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="text-zinc-50 hover:underline font-semibold">
            Connect here
          </Link>
        </div>

      </div>
    </div>
  );
}
