import { useState, useEffect } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { api } from "../services/api";

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginPageProps {
  onLoginSuccess: (apiKey: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [error, setError] = useState("");

  const handleGoogleCredentialResponse = async (response: any) => {
    setError("");
    try {
      const res = await api.post<{
        success: boolean;
        token: string;
        user: { id: string; email: string; role: string };
      }>("/auth/google", {
        credential: response.credential,
      });

      const data = res.data;
      localStorage.setItem("whpk_api_key", data.token);
      localStorage.setItem("whpk_user_role", data.user.role);
      localStorage.setItem("whpk_user_email", data.user.email);

      onLoginSuccess(data.token);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Google authentication failed.",
      );
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId || "YOUR_GOOGLE_CLIENT_ID",
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 352, text: "signin_with" },
        );
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, []);

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
              Webhook Hub
            </h1>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[280px]">
              Developer Portal & Real-time Event Ingestion Logs Dashboard
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center w-full py-2">
          <div
            id="google-signin-btn"
            className="w-full flex justify-center"
          ></div>
        </div>

        <div className="text-center text-xs text-zinc-500 font-medium">
          Secure, passwordless authentication powered by Google.
        </div>
      </div>
    </div>
  );
}
