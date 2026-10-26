import React, { useState, useEffect } from 'react';
import { Globe, Save, CheckCircle2, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
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
    return <div className="py-24 text-center text-zinc-500 text-xs">Loading status page settings...</div>;
  }

  const selectedIds = (pageData?.monitors || []).map(m => (typeof m === 'object' ? m._id : m));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Public Status Page Settings</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure the public URL slug and components displayed on your public status page.
          </p>
        </div>

        {pageData?.slug && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={() => onNavigatePublic(pageData.slug)}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Page
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Status page settings successfully saved.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-[#12141a] border border-zinc-800 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Public Page Title
            </label>
            <input
              type="text"
              required
              value={pageData?.title || ''}
              onChange={e => setPageData({ ...pageData, title: e.target.value })}
              className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Public Slug
            </label>
            <div className="flex items-center rounded-md bg-[#0b0d12] border border-zinc-800 overflow-hidden text-xs">
              <span className="px-2.5 text-zinc-500 font-mono">/#/status/</span>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={pageData?.slug || ''}
                onChange={e => setPageData({ ...pageData, slug: e.target.value.toLowerCase() })}
                className="w-full bg-transparent px-2 py-1.5 text-zinc-200 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Status Description
          </label>
          <input
            type="text"
            value={pageData?.description || ''}
            onChange={e => setPageData({ ...pageData, description: e.target.value })}
            placeholder="Real-time uptime and incident tracking."
            className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          />
        </div>

        {/* Component Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
              Included Monitored Components ({selectedIds.length} active)
            </span>
            <span className="text-[11px] text-zinc-500">
              Only selected monitors will appear on the public page.
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto p-2.5 rounded-md bg-[#0b0d12] border border-zinc-800">
            {userMonitors.length === 0 ? (
              <span className="text-xs text-zinc-500 block py-3 text-center">
                No synthetic monitors created yet.
              </span>
            ) : (
              userMonitors.map(m => {
                const isSelected = selectedIds.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded hover:bg-zinc-800/40 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMonitorIncluded(m._id)}
                        className="rounded bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span className="font-medium text-zinc-200">{m.name}</span>
                    </div>
                    <span className="font-mono text-zinc-500 text-[11px]">{m.method} {m.url}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
