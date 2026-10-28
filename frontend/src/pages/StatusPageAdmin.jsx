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
    return <div className="py-24 text-center text-[#77766B] text-xs font-mono">Loading status page settings...</div>;
  }

  const selectedIds = (pageData?.monitors || []).map(m => (typeof m === 'object' ? m._id : m));

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#D4CCBE]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Public Bulletin Publisher
          </span>
          <h1 className="text-3xl font-serif font-normal text-[#252720] tracking-tight">Status Page Configuration</h1>
          <p className="text-xs text-[#77766B] mt-1">
            Configure the public URL slug and monitored endpoints displayed on your public status page.
          </p>
        </div>

        {pageData?.slug && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-sm bg-[#FAF8F2] hover:bg-[#E8E1D5] border border-[#D4CCBE] text-[#252720] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#427A55]" /> : <Copy className="w-3.5 h-3.5 text-[#77766B]" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={() => onNavigatePublic(pageData.slug)}
              className="px-3.5 py-1.5 rounded-sm bg-[#292B24] hover:bg-[#3D4036] text-[#FAF8F2] text-xs font-mono flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#B6C66B]" />
              View Live Page
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-sm bg-[#427A55]/15 border border-[#427A55]/30 text-[#427A55] text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-[#427A55] shrink-0" />
          <span>Status page settings successfully saved.</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 text-[#C63E32] text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 text-[#C63E32] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
              Public Page Title
            </label>
            <input
              type="text"
              required
              value={pageData?.title || ''}
              onChange={e => setPageData({ ...pageData, title: e.target.value })}
              className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
              Public Slug
            </label>
            <div className="flex items-center rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] overflow-hidden text-xs">
              <span className="px-2.5 text-[#77766B] font-mono bg-[#E8E1D5]/60 border-r border-[#D4CCBE] py-1.5">/#/status/</span>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={pageData?.slug || ''}
                onChange={e => setPageData({ ...pageData, slug: e.target.value.toLowerCase() })}
                className="w-full bg-transparent px-2.5 py-1.5 text-[#252720] font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
            Status Description
          </label>
          <input
            type="text"
            value={pageData?.description || ''}
            onChange={e => setPageData({ ...pageData, description: e.target.value })}
            placeholder="Real-time uptime and incident tracking."
            className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm px-3 py-1.5 text-xs text-[#252720] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
          />
        </div>

        {/* Component Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#77766B]">
              Included Monitored Components ({selectedIds.length} active)
            </span>
            <span className="text-[11px] text-[#77766B]">
              Only selected monitors will appear on the public page.
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto p-2.5 rounded-sm bg-[#E8E1D5]/40 border border-[#D4CCBE]">
            {userMonitors.length === 0 ? (
              <span className="text-xs text-[#77766B] block py-3 text-center">
                No synthetic monitors created yet.
              </span>
            ) : (
              userMonitors.map(m => {
                const isSelected = selectedIds.includes(m._id);
                return (
                  <label
                    key={m._id}
                    className="flex items-center justify-between p-2 rounded-sm hover:bg-[#FAF8F2] cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMonitorIncluded(m._id)}
                        className="rounded-sm bg-[#FAF8F2] border-[#D4CCBE] text-[#D84A2F] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#D84A2F]"
                      />
                      <span className="font-medium text-[#252720]">{m.name}</span>
                    </div>
                    <span className="font-mono text-[#77766B] text-[11px]">{m.method} {m.url}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-[#D4CCBE]">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-sm bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
