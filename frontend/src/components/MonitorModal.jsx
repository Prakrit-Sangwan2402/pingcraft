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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252720]/60 backdrop-blur-[2px] animate-fade-in overflow-y-auto font-sans">
      <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm w-full max-w-xl p-6 shadow-xl relative my-8 text-[#252720]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#77766B] hover:text-[#252720] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4 pb-3 border-b border-[#D4CCBE]">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Telemetry Target Specification
          </span>
          <h3 className="text-xl font-serif font-normal text-[#252720]">
            {isEdit ? 'Edit monitor configuration' : 'Create synthetic monitor'}
          </h3>
          <p className="text-xs text-[#77766B] mt-1">
            Configure URL, probe cadence, and consecutive failure SLA triggers.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 text-[#C63E32] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#C63E32] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
                Monitor name <span className="text-[#C63E32]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Authentication Service"
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
                HTTP method
              </label>
              <select
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
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
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#77766B]">
                Target endpoint URL <span className="text-[#C63E32]">*</span>
              </label>
              <span className="text-[10px] text-[#427A55] font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#427A55]" /> SSRF Protected
              </span>
            </div>
            <input
              type="url"
              required
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.yourdomain.com/health"
              className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Expected status</label>
              <input
                type="number"
                min="100"
                max="599"
                value={formData.expectedStatusCode}
                onChange={e => setFormData({ ...formData, expectedStatusCode: Number(e.target.value) })}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Check frequency</label>
              <select
                value={formData.intervalSeconds}
                onChange={e => setFormData({ ...formData, intervalSeconds: Number(e.target.value) })}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
              >
                <option value={15}>Every 15s</option>
                <option value={30}>Every 30s</option>
                <option value={60}>Every 60s</option>
                <option value={300}>Every 5m</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Timeout (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={formData.timeoutMs}
                onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">Failure SLA</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.failureThreshold}
                onChange={e => setFormData({ ...formData, failureThreshold: Number(e.target.value) })}
                title="Consecutive probe failures before incident triggers"
                className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1.5 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
              />
            </div>
          </div>

          {/* Custom Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#77766B]">Custom request headers</span>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-xs text-[#D84A2F] hover:text-[#D84A2F]/80 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add header
              </button>
            </div>
            {headersList.map((hdr, idx) => (
              <div key={idx} className="flex gap-2 mb-1.5 items-center">
                <input
                  type="text"
                  placeholder="Header Name (e.g. X-Api-Key)"
                  value={hdr.key}
                  onChange={e => updateHeaderRow(idx, 'key', e.target.value)}
                  className="flex-1 bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={hdr.value}
                  onChange={e => updateHeaderRow(idx, 'value', e.target.value)}
                  className="flex-1 bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-2.5 py-1 text-xs text-[#252720] font-mono focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
                />
                <button
                  type="button"
                  onClick={() => removeHeaderRow(idx)}
                  className="p-1 text-[#77766B] hover:text-[#C63E32] transition-colors cursor-pointer"
                  aria-label="Remove header"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Public Status Page toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-[#D4CCBE]">
            <div>
              <span className="text-xs font-medium text-[#252720] block">Public status page visibility</span>
              <span className="text-[11px] text-[#77766B] block mt-0.5">
                Expose this monitor's health to external visitors on the public status bulletin.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded-sm bg-[#FAF8F2] border-[#D4CCBE] text-[#D84A2F] focus:ring-0 w-4 h-4 cursor-pointer accent-[#D84A2F]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D4CCBE]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium text-[#77766B] hover:text-[#252720] bg-[#E8E1D5]/60 hover:bg-[#E8E1D5] border border-[#D4CCBE] rounded-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#D84A2F] hover:bg-[#D84A2F]/90 rounded-sm shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
