import React, { useState, useEffect } from 'react';
import { X, Globe, Sliders, ShieldCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export default function MonitorModal({ isOpen, onClose, onSaved, monitor = null }) {
  const isEdit = Boolean(monitor);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    expectedStatusCode: 200,
    intervalSeconds: 60,
    timeoutMs: 10000,
    failureThreshold: 2,
    recoveryThreshold: 2,
    isPublic: true,
    body: ''
  });

  const [headersList, setHeadersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (monitor) {
      setFormData({
        name: monitor.name || '',
        url: monitor.url || '',
        method: monitor.method || 'GET',
        expectedStatusCode: monitor.expectedStatusCode || 200,
        intervalSeconds: monitor.intervalSeconds || 60,
        timeoutMs: monitor.timeoutMs || 10000,
        failureThreshold: monitor.failureThreshold || 2,
        recoveryThreshold: monitor.recoveryThreshold || 2,
        isPublic: monitor.isPublic !== undefined ? monitor.isPublic : true,
        body: monitor.body || ''
      });

      if (monitor.headers && typeof monitor.headers === 'object') {
        const entries = Object.entries(monitor.headers).map(([k, v]) => ({ key: k, value: v }));
        setHeadersList(entries);
      } else {
        setHeadersList([]);
      }
    } else {
      setFormData({
        name: '',
        url: '',
        method: 'GET',
        expectedStatusCode: 200,
        intervalSeconds: 60,
        timeoutMs: 10000,
        failureThreshold: 2,
        recoveryThreshold: 2,
        isPublic: true,
        body: ''
      });
      setHeadersList([]);
    }
    setError(null);
  }, [monitor, isOpen]);

  if (!isOpen) return null;

  const addHeaderRow = () => {
    setHeadersList([...headersList, { key: '', value: '' }]);
  };

  const removeHeaderRow = (index) => {
    setHeadersList(headersList.filter((_, i) => i !== index));
  };

  const updateHeaderRow = (index, field, val) => {
    const copy = [...headersList];
    copy[index][field] = val;
    setHeadersList(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Build headers map
    const headersMap = {};
    headersList.forEach(({ key, value }) => {
      if (key && key.trim()) {
        headersMap[key.trim()] = value ? value.trim() : '';
      }
    });

    const payload = {
      ...formData,
      headers: headersMap
    };

    try {
      if (isEdit) {
        await api.monitors.update(monitor._id, payload);
      } else {
        await api.monitors.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isEdit ? 'Edit Monitor Configuration' : 'Create New Synthetic Monitor'}
            </h3>
            <p className="text-xs text-slate-400">
              Configure health checks, consecutive failure SLAs, and auto-recovery rules.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monitor Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Authentication Service / Health"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                HTTP Method
              </label>
              <select
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Target Endpoint URL <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SSRF Protected
              </span>
            </div>
            <input
              type="url"
              required
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.yourdomain.com/health"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expected Status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={formData.expectedStatusCode}
                onChange={e => setFormData({ ...formData, expectedStatusCode: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Check Interval</label>
              <select
                value={formData.intervalSeconds}
                onChange={e => setFormData({ ...formData, intervalSeconds: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>Every 15s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 1 min</option>
                <option value={300}>Every 5 min</option>
                <option value={600}>Every 10 min</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={formData.timeoutMs}
                onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Failure SLA</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.failureThreshold}
                onChange={e => setFormData({ ...formData, failureThreshold: Number(e.target.value) })}
                title="Consecutive probe failures before incident triggers"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* SLA Thresholds row */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Incident Trigger Threshold
              </label>
              <span className="text-xs text-slate-300">
                Trigger after <b>{formData.failureThreshold}</b> consecutive failures.
              </span>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Auto-Recovery Threshold
              </label>
              <span className="text-xs text-slate-300">
                Auto-resolve after <b>{formData.recoveryThreshold}</b> consecutive successes.
              </span>
            </div>
          </div>

          {/* Custom Headers Accordion */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Custom HTTP Headers</span>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Header
              </button>
            </div>
            {headersList.map((hdr, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  placeholder="Header Name (e.g. X-Api-Key)"
                  value={hdr.key}
                  onChange={e => updateHeaderRow(idx, 'key', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Header Value"
                  value={hdr.value}
                  onChange={e => updateHeaderRow(idx, 'value', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeHeaderRow(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Public Status Page toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Public Status Page Component</span>
              <span className="text-[11px] text-slate-400 block">
                Show this component on your public status page for external visitors.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-900/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Monitor...' : isEdit ? 'Save Changes' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
