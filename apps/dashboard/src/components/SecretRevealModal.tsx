import { useState } from "react";
import { X, Copy, Check, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface SecretRevealModalProps {
  secret: string;
  onClose: () => void;
}

export default function SecretRevealModal({ secret, onClose }: SecretRevealModalProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-bold text-text-main flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>New Signing Secret</span>
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              This secret will only be shown <strong className="text-amber-400">once</strong>. Copy it now and store it securely — you won't be able to view it again.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-main transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Secret display */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
            Webhook Signing Secret
          </label>
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <code className="flex-grow font-mono text-xs text-amber-300 break-all select-all">
              {revealed ? secret : secret.slice(0, 10) + "•".repeat(Math.max(0, secret.length - 10))}
            </code>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setRevealed((r) => !r)}
                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer border-none bg-transparent text-text-muted hover:text-text-main"
                title={revealed ? "Hide secret" : "Reveal secret"}
              >
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer border-none bg-transparent text-text-muted hover:text-emerald-400"
                title="Copy secret"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
          {copied && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Check size={10} /> Copied to clipboard!
            </span>
          )}
        </div>

        {/* Confirm close */}
        <button
          onClick={onClose}
          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-text-main font-semibold py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150"
        >
          I've copied the secret — Close
        </button>
      </div>
    </div>
  );
}
