import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function PublicStatusPage({ slug, onGoHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await api.statusPages.getPublic(slug);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3EFE6] flex flex-col items-center justify-center p-4 font-sans">
        <Activity className="w-7 h-7 text-[#D84A2F] animate-pulse mb-3" />
        <span className="text-[#77766B] text-xs font-mono uppercase tracking-wider">Querying service health status...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F3EFE6] flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-10 h-10 rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] flex items-center justify-center text-[#77766B] mb-3 mx-auto">
          <AlertTriangle className="w-5 h-5 text-[#C17B27]" />
        </div>
        <h2 className="text-xl font-serif font-normal text-[#252720] mb-1">Status Page Not Found</h2>
        <p className="text-xs text-[#77766B] max-w-sm mb-5">
          The requested status bulletin '{slug}' is either unpublished or nonexistent.
        </p>
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="px-3.5 py-1.5 bg-[#FAF8F2] hover:bg-[#E8E1D5] border border-[#D4CCBE] text-[#252720] rounded-sm text-xs font-mono transition-colors cursor-pointer"
          >
            Go to PingCraft Platform
          </button>
        )}
      </div>
    );
  }

  const { title, description, overallStatus, components = [], incidents = [] } = data;

  const getOverallConfig = (status) => {
    switch (status) {
      case 'ALL_SYSTEMS_OPERATIONAL':
        return {
          bg: 'bg-[#427A55]/15 border-[#427A55]/30 text-[#427A55]',
          icon: CheckCircle2,
          headline: 'All Systems Operational',
          subtext: 'All synthetic probes and components are passing regular health checks.'
        };
      case 'DEGRADED_PERFORMANCE':
        return {
          bg: 'bg-[#C17B27]/15 border-[#C17B27]/30 text-[#C17B27]',
          icon: AlertTriangle,
          headline: 'Degraded System Performance',
          subtext: 'Some service components are experiencing intermittent latency or probe degradation.'
        };
      case 'MAJOR_OUTAGE':
        return {
          bg: 'bg-[#C63E32]/15 border-[#C63E32]/30 text-[#C63E32]',
          icon: ShieldAlert,
          headline: 'Major Service Outage Detected',
          subtext: 'Synthetic probes have detected an active incident in one or more core services.'
        };
      default:
        return {
          bg: 'bg-[#E8E1D5]/60 border-[#D4CCBE] text-[#77766B]',
          icon: Activity,
          headline: 'Monitoring in Progress',
          subtext: 'Collecting initial synthetic health observations.'
        };
    }
  };

  const overall = getOverallConfig(overallStatus);
  const OverallIcon = overall.icon;

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const pastIncidents = incidents.filter(i => i.status === 'RESOLVED');

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#252720] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#D4CCBE]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
              Public Service Bulletin
            </span>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-[#252720]">{title}</h1>
            </div>
            <p className="text-xs text-[#77766B]">{description}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[9px] font-mono text-[#77766B] uppercase tracking-wider block">Last Updated</span>
            <span className="text-[11px] font-mono text-[#252720]">{new Date().toUTCString().slice(0, 22)} UTC</span>
          </div>
        </div>

        {/* Global Overall Status Banner */}
        <div className={`p-4 rounded-sm border flex items-center gap-3.5 ${overall.bg}`}>
          <OverallIcon className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="text-sm font-medium">{overall.headline}</h2>
            <p className="text-xs opacity-90 mt-0.5 font-sans">{overall.subtext}</p>
          </div>
        </div>

        {/* Active Incidents Alert */}
        {activeIncidents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-medium uppercase tracking-wider text-[#C63E32] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Active Incidents
            </h2>
            {activeIncidents.map(inc => (
              <div key={inc.id} className="p-4 rounded-sm bg-[#FAF8F2] border border-[#C63E32]/40 space-y-2 text-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#252720]">{inc.componentName}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-sm bg-[#C63E32]/10 text-[#C63E32] border border-[#C63E32]/30">
                    {inc.status}
                  </span>
                </div>
                <p className="text-[#77766B]">{inc.title}</p>
                <div className="space-y-1 pt-2 border-t border-[#D4CCBE] text-[11px] text-[#77766B] font-mono">
                  {inc.timeline?.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#77766B] shrink-0">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[#252720]">{t.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Components Health List */}
        <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#D4CCBE]">
            <h2 className="text-xs font-mono font-medium text-[#77766B] uppercase tracking-wider">System Components</h2>
            <span className="text-[10px] font-mono text-[#77766B]">24h / 7d Uptime</span>
          </div>

          <div className="divide-y divide-[#D4CCBE]">
            {components.length === 0 ? (
              <div className="py-6 text-center text-[#77766B] text-xs font-mono">
                No public components configured for this status page.
              </div>
            ) : (
              components.map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-[#252720] block">{c.name}</span>
                    <span className="text-[10px] text-[#77766B] font-mono">
                      Last check: {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block font-mono text-[11px] text-[#77766B] tabular-nums">
                      {c.uptime24h !== null && c.uptime24h !== undefined ? `${c.uptime24h}%` : '—'} /{' '}
                      {c.uptime7d !== null && c.uptime7d !== undefined ? `${c.uptime7d}%` : '—'}
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Resolved Incidents (Last 7 Days) */}
        <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-4 space-y-3 shadow-sm">
          <h2 className="text-xs font-mono font-medium text-[#77766B] uppercase tracking-wider">Past Incidents (7 Days)</h2>

          {pastIncidents.length === 0 ? (
            <div className="py-4 text-center text-[#77766B] text-xs font-mono">
              No service outages reported in the past 7 days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pastIncidents.map(inc => (
                <div key={inc.id} className="p-3 rounded-sm bg-[#E8E1D5]/40 border border-[#D4CCBE] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#252720]">{inc.componentName}</span>
                    <span className="text-[#427A55] text-[10px] font-mono font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  </div>
                  <p className="text-[#77766B] text-[11px]">{inc.title}</p>
                  <div className="text-[10px] text-[#77766B] font-mono">
                    Outage duration: {inc.durationSeconds || 0}s • Resolved at {new Date(inc.resolvedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-6 text-[11px] text-[#77766B] flex items-center justify-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-[#D84A2F]" />
          <span>PingCraft Synthetic Observability Engine</span>
        </div>
      </div>
    </div>
  );
}
