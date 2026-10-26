import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Save, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { api } from '../api/client';

export default function StatusPageAdmin({ onNavigatePublic }) {
  const [pageData, setPageData] = useState(null);
  const [userMonitors, setUserMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pageRes, monitorsRes] = await Promise.all([
          api.statusPages.getMy(),
          api.monitors.getAll()
        ]);

        if (pageRes.success && pageRes.data) {
          setPageData(pageRes.data);
        }
        if (monitorsRes.success && monitorsRes.data) {
          setUserMonitors(monitorsRes.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await api.statusPages.updateMy({
        slug: pageData.slug,
        title: pageData.title,
        description: pageData.description,
        monitors: pageData.monitors.map(m => (typeof m === 'object' ? m._id : m)),
        isPublished: pageData.isPublished
      });

      if (res.success && res.data) {
        setPageData(res.data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMonitorIncluded = (monitorId) => {
    const currentList = pageData.monitors.map(m => (typeof m === 'object' ? m._id : m));
    const exists = currentList.includes(monitorId);
    const updated = exists
      ? currentList.filter(id => id !== monitorId)
      : [...currentList, monitorId];

    setPageData({ ...pageData, monitors: updated });
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/#/status/${pageData.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-500 text-sm">Loading status page settings...</div>;
  }

  const selectedIds = (pageData?.monitors || []).map(m => (typeof m === 'object' ? m._id : m));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Public Status Page Config</h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish a public-facing system status page for users and external stakeholders.
          </p>
        </div>

        {pageData?.slug && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Link' : 'Copy URL'}
            </button>
            <button
              onClick={() => onNavigatePublic(pageData.slug)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Page
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Status page settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Public Page Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pageData?.title || ''}
              onChange={e => setPageData({ ...pageData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              URL Slug <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <span className="px-2.5 text-xs text-slate-500 font-mono">/status/</span>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={pageData?.slug || ''}
                onChange={e => setPageData({ ...pageData, slug: e.target.value.toLowerCase() })}
                className="w-full bg-transparent px-2 py-2 text-sm text-slate-200 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Status Description / Header Subtext
          </label>
          <input
            type="text"
            value={pageData?.description || ''}
            onChange={e => setPageData({ ...pageData, description: e.target.value })}
            placeholder="Real-time uptime and incident tracking."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Component Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Included Monitored Components ({selectedIds.length} selected)
            </span>
            <span className="text-[11px] text-slate-500">
              Only selected monitors with Public visibility will appear on the status page.
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800">
            {userMonitors.length === 0 ? (
              <span className="text-xs text-slate-500 block py-4 text-center">
                No synthetic monitors created yet.
              </span>
            ) : (
              userMonitors.map(m => {
                const isSelected = selectedIds.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMonitorIncluded(m._id)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span className="font-medium text-slate-200">{m.name}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">{m.method} {m.url}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Status Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
