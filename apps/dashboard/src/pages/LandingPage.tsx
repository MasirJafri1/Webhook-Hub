import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Webhook,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCcw,
  Users,
  Terminal,
  Code,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";

export default function LandingPage() {
  const [demoState, setDemoState] = useState<"idle" | "sending" | "success">("idle");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const demoApiKey = "whpk_live_8f3d2a9c1e7b";
  const demoEndpointId = "ep_92f8a1c5d3e7";
  const isLoggedIn = !!localStorage.getItem("whpk_api_key");

  const steps = [
    {
      id: 1,
      title: "Create Endpoint",
      desc: "Register your destination server URL and choose the specific events you want to listen to (e.g. order.placed).",
    },
    {
      id: 2,
      title: "Get Credentials",
      desc: "Generate your secure project API Key and copy your Endpoint ID to authenticate incoming webhook events.",
    },
    {
      id: 3,
      title: "Publish Events",
      desc: "Send events from your source backend. The engine delivers them to all targets securely in under 200ms.",
    }
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`fetch('https://api.webhookhub.com/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${demoApiKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpointId: '${demoEndpointId}',
    eventType: 'order.placed',
    payload: { id: 'ord_102', amount: 2999 }
  })
});`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const runDemo = () => {
    if (demoState !== "idle") return;
    setDemoState("sending");
    setTimeout(() => {
      setDemoState("success");
    }, 1500);
  };

  const resetDemo = () => {
    setDemoState("idle");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden relative">

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-20" />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Webhook size={18} className="text-white" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              WebHook Hub
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://webhook-platform-api.masirjafri1.workers.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-zinc-400 hover:text-zinc-50 transition-colors px-1 py-1.5"
            >
              API Reference
            </a>

            <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-zinc-400 hover:text-zinc-50 transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left text column */}
        <div className="flex flex-col gap-6 lg:col-span-6 text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 w-fit">
            <Zap size={12} className="animate-pulse" />
            <span>Developer-First Webhook Infrastructure</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-zinc-50 leading-[1.1] tracking-tight">
            Reliable webhooks. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              Delivered at the edge.
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 leading-relaxed font-light">
            Register webhook endpoints, configure smart retries, verify message signatures, and monitor your delivery pipelines in real-time. Scales with your stack.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold px-7 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-xl text-base"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold px-7 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-xl text-base"
                >
                  <span>Deploy For Free</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-50 font-semibold px-7 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-base"
                >
                  <span>Explore Dashboard</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right column: Interactive Sandbox Terminal */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-md p-5 flex flex-col gap-4 relative">

            {/* Top Bar buttons */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 block" />
                <span className="text-xs text-zinc-500 font-mono ml-2">Checkout Simulator</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded">
                demo.html
              </div>
            </div>

            {/* Simulated T-shirt checkout card */}
            <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="text-3xl bg-zinc-900 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800/60">
                  👕
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-zinc-200">Retro Summer Tee</h4>
                  <p className="text-xs text-zinc-500">$29.99 USD • Ref: ord_102</p>
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                1x
              </span>
            </div>

            {/* Sandbox details */}
            <div className="flex flex-col gap-2.5 text-xs text-left bg-zinc-950 p-3.5 border border-zinc-850 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Endpoint ID</span>
                <code className="font-mono text-indigo-400">{demoEndpointId}</code>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">API Authentication Key</span>
                <code className="font-mono text-zinc-400">whpk_live_••••••••••••</code>
              </div>
            </div>

            {/* Trigger Button */}
            {demoState === "idle" && (
              <button
                onClick={runDemo}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer text-sm"
              >
                Simulate Purchase
              </button>
            )}

            {demoState === "sending" && (
              <button
                disabled
                className="w-full bg-indigo-500/30 text-indigo-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-wait text-sm"
              >
                <RefreshCcw size={14} className="animate-spin" />
                <span>Processing Order & Dispatching Webhook...</span>
              </button>
            )}

            {demoState === "success" && (
              <div className="flex flex-col gap-3">
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm animate-in fade-in duration-300">
                  <CheckCircle2 size={16} />
                  <span>🎉 Order Dispatched to Receiver Server!</span>
                </div>
                <button
                  onClick={resetDemo}
                  className="text-xs text-zinc-400 hover:text-zinc-50 transition-all font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Run Demo Again
                </button>
              </div>
            )}

            {/* Webhook Response Log Drawer overlay */}
            <div className="border border-zinc-800/80 bg-zinc-950 rounded-xl p-3 text-left font-mono text-[11px] leading-relaxed relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 mb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal size={11} className="text-zinc-500" />
                  <span>Server-Side Receiver Output</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${demoState === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-900 text-zinc-500"}`}>
                  {demoState === "success" ? "200 OK" : "Listening..."}
                </span>
              </div>
              <pre className="text-zinc-400 max-h-[100px] overflow-y-auto">
                {demoState === "idle" && `// Click 'Simulate Purchase' above to watch webhooks stream in...`}
                {demoState === "sending" && `[LOG] Outgoing request payload compiled...
[POST] Sending cryptography-signed request payload to warehouse...`}
                {demoState === "success" && `{
  "event": "order.placed",
  "delivered_at": "${new Date().toLocaleTimeString()}",
  "signature": "whsec_89df2c...",
  "data": {
    "order_id": "ord_102",
    "amount_cents": 2999,
    "shipping": "123 Event Lane",
    "customer": "John Doe"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-zinc-900/30 border-y border-zinc-900 py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <h2 className="text-3xl font-display font-extrabold text-zinc-50 tracking-tight">
              Production-Ready Edge Engine
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl font-light">
              We provide the core tools required to run robust, scalable, and secure webhook infrastructures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Ultra-Low Latency</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Built on Cloudflare's global edge workers and D1 databases. Route events globally to your consumers in milliseconds.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Cryptographic Signatures</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Secure incoming payloads using SHA-256 HMAC signatures. Recipients can verify that payloads were sent by WebHook Hub.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RefreshCcw size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Automatic Backoff Retries</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  If the receiving server goes offline, our engine retries deliveries automatically with exponential backoff configurations.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Multi-Tenant Workspaces</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Manage different companies, organizations, and team members with isolated project views and role-based permissions.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Observability & Audits</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Review complete event payloads, headers, latency statistics, failure reason stack traces, and tenant action audit logs.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 flex flex-col gap-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl text-left hover:border-zinc-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1">Custom JSON Transforms</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Map and reshape event payloads dynamically on the fly before sending, accommodating custom receiver JSON schemas.
                </p>
              </div>
            </div>

            {/* Feature 7 */}
            <a
              href="https://webhook-platform-api.masirjafri1.workers.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 flex flex-col gap-4 border border-indigo-500/30 bg-indigo-500/5 rounded-2xl text-left hover:border-indigo-400/80 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Code size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base mb-1 flex items-center gap-1.5">
                  <span>Interactive API Docs</span>
                  <ArrowRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-400" />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  Complete OpenAPI 3.0 specification served with interactive Scalar playgrounds. Test and debug endpoints directly from your browser.
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Visual Tutorial / Walkthrough Guide */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <h2 className="text-3xl font-display font-extrabold text-zinc-50 tracking-tight">
            How It Works in 3 Steps
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl font-light">
            Follow this simple flow to get your application integrated with WebHook Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left instructions list */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-5 rounded-2xl border text-left flex gap-4 transition-all cursor-pointer ${activeStep === step.id ? "bg-zinc-900/50 border-zinc-700 shadow-lg" : "bg-transparent border-zinc-900 hover:bg-zinc-900/20 hover:border-zinc-800"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 ${activeStep === step.id ? "bg-indigo-500 text-white" : "bg-zinc-900 text-zinc-500"}`}>
                  {step.id}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className={`font-bold text-sm ${activeStep === step.id ? "text-zinc-50" : "text-zinc-400"}`}>{step.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{step.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right code snippet preview card */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md p-5 flex flex-col gap-4 text-left">

              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Code size={15} className="text-indigo-400" />
                  <span className="font-mono text-xs text-zinc-400">NodeJS / Fetch Example</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer bg-zinc-950 transition-all"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl overflow-x-auto">
                <pre className="font-mono text-xs text-zinc-300 leading-relaxed">
                  {`fetch('https://api.webhookhub.com/api/v1/events', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer `}
                  <span className="text-indigo-400">{demoApiKey}</span>
                  {`',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpointId: '`}
                  <span className="text-purple-400">{demoEndpointId}</span>
                  {`',
    eventType: 'order.placed',
    payload: {
      order_id: "ord_102",
      amount: 2999,
      currency: "usd",
      items: [{ name: "Retro Summer Tee", quantity: 1 }],
      shipping_address: {
        name: "John Doe",
        street: "123 Event Lane"
      }
    }
  })
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Panel */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="p-8 md:p-12 border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-900/10 backdrop-blur-md rounded-3xl text-center flex flex-col items-center gap-5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-zinc-50 max-w-lg tracking-tight">
            Ready to route webhooks with total peace of mind?
          </h2>
          <p className="text-sm text-zinc-400 max-w-md font-light leading-relaxed">
            Get started for free. Integrate in under 5 minutes and scale to millions of monthly events. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-3">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-xl active:scale-[0.98]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold px-7 py-3 rounded-xl transition-all shadow-xl active:scale-[0.98]"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent hover:bg-white/[0.04] border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-50 font-semibold px-7 py-3 rounded-xl transition-all"
                >
                  Log In to Console
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-10 bg-zinc-950/40 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Webhook size={16} className="text-indigo-400" />
            <span className="text-xs text-zinc-500 font-mono">
              © {new Date().getFullYear()} WebHook Hub. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="https://masirjafri.in" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
              masirjafri.in
            </a>
            <a href="https://github.com/MasirJafri1" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
              GitHub
            </a>
            <a href="https://blog.masirjafri.in" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">
              Blog
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
