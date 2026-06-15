import React, { useState } from "react";
import { KeyRound, ShieldAlert, Sparkles, Loader2, Mail, Lock } from "lucide-react";
import axios from "axios";
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
  const [isSeeding, setIsSeeding] = useState(false);

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

  const handleSeedAdmin = async () => {
    setIsSeeding(true);
    setError("");
    try {
      const baseApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:8790/api/v1").replace("/api/v1", "");
      // 1. Seed database with test projects and default Super Admin user credentials
      await axios.post(`${baseApiUrl}/test/seed`);

      // 2. Perform regular auth login with the seeded admin account to generate production JWT token
      const loginRes = await api.post<{
        success: boolean;
        token: string;
        user: { id: string; email: string; role: string };
      }>("/auth/login", {
        email: "admin@webhook.com",
        password: "AdminSecurePassword123",
      });

      const data = loginRes.data;
      localStorage.setItem("whpk_api_key", data.token);
      localStorage.setItem("whpk_user_role", data.user.role);
      localStorage.setItem("whpk_user_email", data.user.email);
      
      onLoginSuccess(data.token);
    } catch (err: any) {
      console.error(err);
      setError("Failed to seed and authenticate Super Admin user. Make sure your local API worker is running.");
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
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="developer@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] pl-10 pr-4 py-3 rounded-lg text-white text-sm tracking-wide transition-all focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] pl-10 pr-4 py-3 rounded-lg text-white text-sm tracking-wide transition-all focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] placeholder-slate-600"
                required
              />
            </div>
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
            <span>Login</span>
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <Link to="/signup" className="text-indigo-400 hover:underline font-semibold">
            Sign up here
          </Link>
        </div>

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
          onClick={handleSeedAdmin}
          disabled={isLoading || isSeeding}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium py-3 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isSeeding ? (
            <Loader2 size={16} className="animate-spin text-cyan-400" />
          ) : (
            <Sparkles size={16} className="text-cyan-400" />
          )}
          <span>Seed & Login as Admin</span>
        </button>

        <p className="text-[10px] text-center text-slate-500 leading-normal">
          Clicking "Seed & Login as Admin" initializes the default Super Admin (<code className="text-indigo-400">admin@webhook.com</code> / <code className="text-indigo-400">AdminSecurePassword123</code>) in D1 and logs you in instantly.
        </p>

      </div>
    </div>
  );
}
