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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131A23] border border-[#263241] rounded-xl w-full max-w-lg p-6 shadow-2xl relative text-[#E8EDF4]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9AA8B8] hover:text-[#E8EDF4]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-[#1D2733]">
          <h3 className="text-base font-semibold text-[#E8EDF4] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3DD6C6]" /> Instant Synthetic Probe
          </h3>
          <p className="text-xs text-[#9AA8B8] mt-0.5">
            Execute a live synthetic probe with monotonic high-precision latency measurement.
          </p>
        </div>

        {/* SSRF Notice */}
        <div className="mb-4 p-2.5 rounded-lg bg-[#0E131A] border border-[#263241] flex items-center gap-2.5 text-[11px] text-[#9AA8B8]">
          <ShieldCheck className="w-4 h-4 text-[#3DD6C6] shrink-0" />
          <span>Active SSRF protection blocks loopback (127.0.0.1), private subnets, and cloud metadata.</span>
        </div>

        <form onSubmit={handleProbe} className="space-y-3.5">
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <label className="block text-[11px] font-medium text-[#9AA8B8] mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-mono"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-[#9AA8B8] mb-1">Target URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/health"
                className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-3 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#9AA8B8] mb-1">Expected Status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={expectedStatusCode}
                onChange={e => setExpectedStatusCode(e.target.value)}
                className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#9AA8B8] mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="500"
                value={timeoutMs}
                onChange={e => setTimeoutMs(e.target.value)}
                className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-2.5 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {loading ? 'Running Probe...' : 'Execute Probe'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-4 p-3.5 rounded-lg bg-[#0E131A] border border-[#263241] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#1D2733]">
              <span className="text-[11px] font-medium text-[#9AA8B8] uppercase font-mono">Telemetry Diagnostics</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  result.isSuccess
                    ? 'bg-[#45D483]/10 text-[#45D483] border-[#45D483]/20'
                    : 'bg-[#FF647C]/10 text-[#FF647C] border-[#FF647C]/20'
                }`}
              >
                {result.isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {result.isSuccess ? 'Success (Expected Code)' : 'Failed Check'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="bg-[#192330] p-2 rounded-lg border border-[#263241]">
                <span className="block text-[10px] text-[#687789] font-sans">Status</span>
                <span className="font-semibold text-[#E8EDF4]">
                  {result.statusCode ? `HTTP ${result.statusCode}` : 'None'}
                </span>
              </div>
              <div className="bg-[#192330] p-2 rounded-lg border border-[#263241]">
                <span className="block text-[10px] text-[#687789] font-sans">Latency</span>
                <span className="font-semibold text-[#3DD6C6]">
                  {result.latencyMs} ms
                </span>
              </div>
              <div className="bg-[#192330] p-2 rounded-lg border border-[#263241]">
                <span className="block text-[10px] text-[#687789] font-sans">Payload</span>
                <span className="font-semibold text-[#E8EDF4]">
                  {result.responseSize} B
                </span>
              </div>
            </div>

            {!result.isSuccess && result.errorMessage && (
              <div className="text-[11px] text-[#FF647C] bg-[#FF647C]/10 border border-[#FF647C]/20 p-2.5 rounded-lg font-sans">
                <div className="font-mono text-[10px] font-semibold">{result.errorCategory}</div>
                <div className="mt-0.5 text-xs">{result.errorMessage}</div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/20 text-[#FF647C] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
