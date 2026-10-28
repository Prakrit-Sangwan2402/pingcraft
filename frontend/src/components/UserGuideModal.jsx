import React from 'react';
import { X, CheckCircle2, ShieldAlert, Zap, Globe, Layers, Play } from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose, onSeedDemo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252720]/60 backdrop-blur-[2px] animate-fade-in overflow-y-auto font-sans">
      <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm w-full max-w-2xl p-6 shadow-xl relative my-8 text-[#252720]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#77766B] hover:text-[#252720] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pb-3 border-b border-[#D4CCBE]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Documentation & Standard Procedures
          </span>
          <h2 className="text-2xl font-serif font-normal text-[#252720]">How to test & operate PingCraft</h2>
          <p className="text-xs text-[#77766B] mt-1">
            Follow this operational guide to verify core synthetic probes, background schedulers, and incident lifecycles.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Quick Start Option */}
          <div className="p-3.5 rounded-sm bg-[#E8E1D5]/60 border border-[#D4CCBE] flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-[#252720] block">Step 0: Load demonstration monitors</span>
              <span className="text-[#77766B] text-[11px]">
                Click this button to automatically provision 4 realistic targets (GitHub, Cloudflare, HttpBin, and an Outage Target).
              </span>
            </div>
            {onSeedDemo && (
              <button
                onClick={() => {
                  onSeedDemo();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-sm bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white font-medium text-xs whitespace-nowrap transition-colors shadow-sm cursor-pointer"
              >
                Load Demo Monitors
              </button>
            )}
          </div>

          {/* Workflow 1 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-sm bg-[#292B24] text-[#FAF8F2] font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-serif font-normal text-[#252720] text-sm">Background probes & telemetry</h3>
              <p className="text-[#77766B] mt-0.5 leading-relaxed">
                The Node.js scheduler automatically probes each active monitor according to its interval (e.g. 15s / 30s).
                Click on any monitor entry to view its <b>Response Latency Trend</b>, rolling <b>24h Uptime %</b>, <b>p95 Latency</b>, and exact historical telemetry logs.
              </p>
            </div>
          </div>

          {/* Workflow 2 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-sm bg-[#292B24] text-[#FAF8F2] font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-serif font-normal text-[#252720] text-sm">Testing outage & incident state machine</h3>
              <p className="text-[#77766B] mt-0.5 leading-relaxed">
                Notice the monitor named <b>"Simulated Outage Endpoint"</b> (configured to target an HTTP 503 error).
                On the first failure, it transitions to <span className="text-[#C17B27] font-medium font-mono text-[11px]">DEGRADED</span>.
                After 2 consecutive failures, it flips to <span className="text-[#C63E32] font-medium font-mono text-[11px]">OUTAGE</span> and automatically opens an incident log.
              </p>
            </div>
          </div>

          {/* Workflow 3 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-sm bg-[#292B24] text-[#FAF8F2] font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-serif font-normal text-[#252720] text-sm">The incident war room</h3>
              <p className="text-[#77766B] mt-0.5 leading-relaxed">
                Select <b>Incident War Room</b> in the top navigation.
                Inspect incident telemetry, view the immutable audit timeline, and transition the status:
                <code className="mx-1 px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#D84A2F]">TRIGGERED</code> →
                <code className="mx-1 px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#D84A2F]">INVESTIGATING</code> →
                <code className="mx-1 px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#D84A2F]">MITIGATING</code> →
                <code className="mx-1 px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#427A55]">RESOLVED</code>.
              </p>
            </div>
          </div>

          {/* Workflow 4 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-sm bg-[#292B24] text-[#FAF8F2] font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="font-serif font-normal text-[#252720] text-sm">SSRF defense validation</h3>
              <p className="text-[#77766B] mt-0.5 leading-relaxed">
                Click <b>Instant Probe</b> on the registry dashboard. Try entering <code className="px-1.5 py-0.5 bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#252720]">http://localhost:5000/api/health</code> or <code className="px-1.5 py-0.5 bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#252720]">http://192.168.1.1</code>.
                The security engine detects and rejects loopback and private subnets before opening any socket.
              </p>
            </div>
          </div>

          {/* Workflow 5 */}
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-sm bg-[#292B24] text-[#FAF8F2] font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              5
            </div>
            <div>
              <h3 className="font-serif font-normal text-[#252720] text-sm">Public status page</h3>
              <p className="text-[#77766B] mt-0.5 leading-relaxed">
                Navigate to <b>Public Status Page</b>. Select which monitors are visible, copy the public link (<code className="px-1.5 py-0.5 bg-[#E8E1D5] border border-[#D4CCBE] font-mono text-[#252720]">/#/status/:slug</code>), and view the live status in an unauthenticated incognito tab.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#D4CCBE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm bg-[#E8E1D5]/60 hover:bg-[#E8E1D5] border border-[#D4CCBE] text-[#252720] font-medium text-xs transition-colors cursor-pointer"
          >
            Close guide
          </button>
        </div>
      </div>
    </div>
  );
}
