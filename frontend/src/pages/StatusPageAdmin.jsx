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
    return <div className="py-24 text-center text-[#9AA8B8] text-xs">Loading status page settings...</div>;
  }

  const selectedIds = (pageData?.monitors || []).map(m => (typeof m === 'object' ? m._id : m));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1D2733]">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF4] tracking-tight">Public Status Page Settings</h1>
          <p className="text-xs text-[#9AA8B8] mt-1">
            Configure the public URL slug and components displayed on your public status page.
          </p>
        </div>

        {pageData?.slug && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-[#192330] hover:bg-[#202B39] border border-[#263241] text-[#9AA8B8] hover:text-[#E8EDF4] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#45D483]" /> : <Copy className="w-3.5 h-3.5 text-[#687789]" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={() => onNavigatePublic(pageData.slug)}
              className="px-3.5 py-1.5 rounded-lg bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Page
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-[#45D483]/10 border border-[#45D483]/20 text-[#45D483] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#45D483] shrink-0" />
          <span>Status page settings successfully saved.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/20 text-[#FF647C] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#FF647C] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-[#131A23] border border-[#263241] rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#9AA8B8] mb-1">
              Public Page Title
            </label>
            <input
              type="text"
              required
              value={pageData?.title || ''}
              onChange={e => setPageData({ ...pageData, title: e.target.value })}
              className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-3 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA8B8] mb-1">
              Public Slug
            </label>
            <div className="flex items-center rounded-lg bg-[#0E131A] border border-[#263241] overflow-hidden text-xs">
              <span className="px-2.5 text-[#687789] font-mono">/#/status/</span>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={pageData?.slug || ''}
                onChange={e => setPageData({ ...pageData, slug: e.target.value.toLowerCase() })}
                className="w-full bg-transparent px-2 py-1.5 text-[#E8EDF4] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9AA8B8] mb-1">
            Status Description
          </label>
          <input
            type="text"
            value={pageData?.description || ''}
            onChange={e => setPageData({ ...pageData, description: e.target.value })}
            placeholder="Real-time uptime and incident tracking."
            className="w-full bg-[#0E131A] border border-[#263241] rounded-lg px-3 py-1.5 text-xs text-[#E8EDF4] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6]"
          />
        </div>

        {/* Component Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#9AA8B8] uppercase tracking-wide">
              Included Monitored Components ({selectedIds.length} active)
            </span>
            <span className="text-[11px] text-[#687789]">
              Only selected monitors will appear on the public page.
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto p-2.5 rounded-lg bg-[#0E131A] border border-[#263241]">
            {userMonitors.length === 0 ? (
              <span className="text-xs text-[#687789] block py-3 text-center">
                No synthetic monitors created yet.
              </span>
            ) : (
              userMonitors.map(m => {
                const isSelected = selectedIds.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#192330]/60 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMonitorIncluded(m._id)}
                        className="rounded bg-[#0B0F14] border-[#263241] text-[#3DD6C6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-medium text-[#E8EDF4]">{m.name}</span>
                    </div>
                    <span className="font-mono text-[#687789] text-[11px]">{m.method} {m.url}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[#1D2733]">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
