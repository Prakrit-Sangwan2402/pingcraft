import React from 'react';
import { X, CheckCircle2, ShieldAlert, Zap, Globe, Layers, Play } from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose, onSeedDemo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#12141c] border border-zinc-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl relative my-8 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pb-3 border-b border-zinc-800">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">Interactive Walkthrough</span>
          <h2 className="text-xl font-bold text-white mt-0.5">How to Test & Use PingCraft</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Follow this 5-minute guide to verify all core workflows, background probes, and incident handling.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Quick Start Option */}
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-white block">Step 0: Load Instant Demo Monitors</span>
              <span className="text-zinc-400 text-[11px]">
                Click this button to automatically create 4 real endpoints (GitHub, Cloudflare, HttpBin, and an Outage Target).
              </span>
            </div>
            {onSeedDemo && (
              <button
                onClick={() => {
                  onSeedDemo();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs whitespace-nowrap transition-colors"
              >
                Load Demo Monitors
              </button>
            )}
          </div>

          {/* Workflow 1 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Background Probes & Telemetry</h3>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                The Node.js scheduler automatically probes each active monitor according to its interval (e.g. 15s / 30s).
                Click on any monitor card to see its <b>Response Latency Trend chart</b>, rolling <b>24h Uptime %</b>, <b>p95 Latency</b>, and exact historical ping logs.
              </p>
            </div>
          </div>

          {/* Workflow 2 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Testing Outage & Incident State Machine</h3>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                Notice the monitor named <b>"Simulated Outage Endpoint"</b> (configured to target an HTTP 503 error).
                On the first failure, it turns <span className="text-amber-400 font-medium">Degraded</span>.
                After 2 consecutive failures, it flips to <span className="text-red-400 font-medium">Outage</span> and automatically creates an incident record!
              </p>
            </div>
          </div>

          {/* Workflow 3 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">The Incident War Room</h3>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                Click <b>Incident War Room</b> in the top navigation.
                You can inspect the incident details, view the immutable audit timeline, and transition the status:
                <code className="mx-1 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">TRIGGERED</code> $\rightarrow$
                <code className="mx-1 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">INVESTIGATING</code> $\rightarrow$
                <code className="mx-1 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">MITIGATING</code> $\rightarrow$
                <code className="mx-1 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">RESOLVED</code>.
              </p>
            </div>
          </div>

          {/* Workflow 4 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Testing SSRF Defense Shield</h3>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                Click <b>Instant Probe</b> on the dashboard. Try entering <code className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 font-mono">http://localhost:5000/api/health</code> or <code className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 font-mono">http://192.168.1.1</code>.
                The security engine detects and rejects the loopback/private IP before any connection is initiated!
              </p>
            </div>
          </div>

          {/* Workflow 5 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-300 font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              5
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Public Status Page</h3>
              <p className="text-zinc-400 mt-0.5 leading-relaxed">
                Click <b>Public Status Page</b> in the navigation. Select which monitors to display, copy your public link (<code className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 font-mono">/#/status/:slug</code>), and view it in an incognito window without logging in!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
}
