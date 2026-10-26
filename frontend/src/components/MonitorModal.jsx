import React, { useState, useEffect } from 'react';
import { X, Sliders, ShieldCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';
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
      <div className="bg-[#12141c] border border-zinc-800 rounded-lg w-full max-w-xl p-5 shadow-2xl relative my-8 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">
            {isEdit ? 'Edit Monitor Configuration' : 'Create Synthetic Monitor'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure URL, check frequency, and consecutive failure SLA triggers.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-md bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Monitor Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Authentication Service"
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                HTTP Method
              </label>
              <select
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
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
              <label className="text-xs font-medium text-zinc-300">
                Target Endpoint URL <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> SSRF Protected
              </span>
            </div>
            <input
              type="url"
              required
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.yourdomain.com/health"
              className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Expected Status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={formData.expectedStatusCode}
                onChange={e => setFormData({ ...formData, expectedStatusCode: Number(e.target.value) })}
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Check Frequency</label>
              <select
                value={formData.intervalSeconds}
                onChange={e => setFormData({ ...formData, intervalSeconds: Number(e.target.value) })}
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
              >
                <option value={15}>Every 15s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 60s</option>
                <option value={300}>Every 5m</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={formData.timeoutMs}
                onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">Failure SLA</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.failureThreshold}
                onChange={e => setFormData({ ...formData, failureThreshold: Number(e.target.value) })}
                title="Consecutive probe failures before incident triggers"
                className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Custom Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Custom Request Headers</span>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Header
              </button>
            </div>
            {headersList.map((hdr, idx) => (
              <div key={idx} className="flex gap-2 mb-1.5 items-center">
                <input
                  type="text"
                  placeholder="Name (e.g. X-Api-Key)"
                  value={hdr.key}
                  onChange={e => updateHeaderRow(idx, 'key', e.target.value)}
                  className="flex-1 bg-[#0b0d12] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={hdr.value}
                  onChange={e => updateHeaderRow(idx, 'value', e.target.value)}
                  className="flex-1 bg-[#0b0d12] border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => removeHeaderRow(idx)}
                  className="p-1 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Public Status Page toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Public Status Page Visibility</span>
              <span className="text-[10px] text-zinc-500 block">
                Expose this monitor's health to external visitors on the public status page.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
