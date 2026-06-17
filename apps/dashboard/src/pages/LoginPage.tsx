import React, { useState } from "react";
import { KeyRound, ShieldAlert, Loader2, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface LoginPageProps {
  onLoginSuccess: (apiKey: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await api.post<{
        success: boolean;
        token: string;
        user: { id: string; email: string; role: string };
      }>("/auth/login", {
        email: email.trim(),
        password,
      });

      const data = res.data;
      localStorage.setItem("whpk_api_key", data.token);
      localStorage.setItem("whpk_user_role", data.user.role);
      localStorage.setItem("whpk_user_email", data.user.email);
      
      onLoginSuccess(data.token);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        "Invalid email/password or server connection failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-50 p-4 relative font-sans">
      {/* Main Container */}
      <div className="w-full max-w-md p-8 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl relative flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-10 w-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-50">
            <KeyRound size={20} />
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 font-sans">
              Connect to Webhooks
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Developer Portal & Event Delivery Dashboard
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                placeholder="developer@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2 rounded-md text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-4 py-2 rounded-md text-zinc-50 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 placeholder-zinc-700 transition-all"
                required
              />
            </div>
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
            className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2 px-4 rounded-md cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Login</span>
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Need an account?{" "}
          <Link to="/signup" className="text-zinc-50 hover:underline font-semibold">
            Sign up here
          </Link>
        </div>

      </div>
    </div>
  );
}
