import React, { useState } from 'react';
import { Play, X, ShieldCheck, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { api } from '../api/client';

export default function InstantProbeModal({ isOpen, onClose, initialUrl = '' }) {
  const [url, setUrl] = useState(initialUrl || 'https://httpbin.org/status/200');
  const [method, setMethod] = useState('GET');
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleProbe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.monitors.instantProbe({
        url,
        method,
        expectedStatusCode: Number(expectedStatusCode),
        timeoutMs: Number(timeoutMs)
      });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252720]/60 backdrop-blur-[2px] animate-fade-in font-sans">
      <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm w-full max-w-lg p-6 shadow-xl relative text-[#252720]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#77766B] hover:text-[#252720] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-[#D4CCBE]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Diagnostic Instrument
          </span>
          <h3 className="text-xl font-serif font-normal text-[#252720] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D84A2F]" /> Instant synthetic probe
          </h3>
          <p className="text-xs text-[#77766B] mt-1">
            Execute a live synthetic probe with monotonic high-precision latency measurement.
          </p>
        </div>

        {/* SSRF Notice */}
        <div className="mb-4 p-2.5 rounded-sm bg-[#E8E1D5]/60 border border-[#D4CCBE] flex items-center gap-2.5 text-[11px] text-[#77766B]">
          <ShieldCheck className="w-4 h-4 text-[#427A55] shrink-0" />
          <span>Active SSRF protection blocks loopback (127.0.0.1), private subnets, and cloud metadata.</span>
        </div>

        <form onSubmit={handleProbe} className="space-y-3.5">
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Target URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/health"
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Expected status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={expectedStatusCode}
                onChange={e => setExpectedStatusCode(e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="500"
                value={timeoutMs}
                onChange={e => setTimeoutMs(e.target.value)}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white font-medium rounded-sm text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Running probe...' : 'Execute probe'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-4 p-3.5 rounded-sm bg-[#292B24] border border-[#292B24] space-y-2.5 text-xs text-[#FAF8F2]">
            <div className="flex items-center justify-between pb-2 border-b border-[#3D4036]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FAF8F2]/70">Telemetry diagnostics</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium border ${
                  result.isSuccess
                    ? 'bg-[#427A55]/30 text-[#B6C66B] border-[#427A55]'
                    : 'bg-[#C63E32]/30 text-[#FF8577] border-[#C63E32]'
                }`}
              >
                {result.isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {result.isSuccess ? 'Success (Expected Code)' : 'Failed Check'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="bg-[#1F211B] p-2 rounded-sm border border-[#3D4036]">
                <span className="block text-[9px] text-[#FAF8F2]/60 uppercase tracking-wider font-sans">Status</span>
                <span className="font-semibold text-[#FAF8F2] tabular-nums">
                  {result.statusCode ? `HTTP ${result.statusCode}` : 'None'}
                </span>
              </div>
              <div className="bg-[#1F211B] p-2 rounded-sm border border-[#3D4036]">
                <span className="block text-[9px] text-[#FAF8F2]/60 uppercase tracking-wider font-sans">Latency</span>
                <span className="font-semibold text-[#B6C66B] tabular-nums">
                  {result.latencyMs} ms
                </span>
              </div>
              <div className="bg-[#1F211B] p-2 rounded-sm border border-[#3D4036]">
                <span className="block text-[9px] text-[#FAF8F2]/60 uppercase tracking-wider font-sans">Payload</span>
                <span className="font-semibold text-[#FAF8F2] tabular-nums">
                  {result.responseSize} B
                </span>
              </div>
            </div>

            {!result.isSuccess && result.errorMessage && (
              <div className="text-[11px] text-[#FF8577] bg-[#C63E32]/20 border border-[#C63E32]/40 p-2.5 rounded-sm font-sans">
                <div className="font-mono text-[10px] font-semibold">{result.errorCategory}</div>
                <div className="mt-0.5 text-xs">{result.errorMessage}</div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 text-[#C63E32] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
