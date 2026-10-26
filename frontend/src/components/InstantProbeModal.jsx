import React, { useState } from 'react';
import { Play, X, ShieldCheck, CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instant Synthetic Probe</h3>
            <p className="text-xs text-slate-400">
              Run an immediate live health probe with high-resolution latency measurement.
            </p>
          </div>
        </div>

        {/* SSRF Security notice badge */}
        <div className="mb-4 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Active SSRF shield rejects loopback, RFC 1918 private subnets, and metadata IPs.</span>
        </div>

        <form onSubmit={handleProbe} className="space-y-4">
          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <label className="block text-xs font-medium text-slate-400 mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Target URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/health"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expected Status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={expectedStatusCode}
                onChange={e => setExpectedStatusCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="500"
                value={timeoutMs}
                onChange={e => setTimeoutMs(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {loading ? 'Executing synthetic probe...' : 'Execute Probe'}
          </button>
        </form>

        {/* Results display */}
        {result && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Probe Result</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  result.isSuccess
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {result.isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {result.isSuccess ? 'Success (Expected Status)' : 'Failed Check'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="block text-[11px] text-slate-400">Status Code</span>
                <span className="font-mono font-bold text-base text-slate-200">
                  {result.statusCode ? `HTTP ${result.statusCode}` : 'None'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="block text-[11px] text-slate-400">Response Latency</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {result.latencyMs} ms
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <span className="block text-[11px] text-slate-400">Payload Size</span>
                <span className="font-mono font-bold text-base text-slate-200">
                  {result.responseSize} bytes
                </span>
              </div>
            </div>

            {!result.isSuccess && result.errorMessage && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-lg">
                <div className="font-semibold">{result.errorCategory}</div>
                <div className="text-slate-300 mt-0.5">{result.errorMessage}</div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
