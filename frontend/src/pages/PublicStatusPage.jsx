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
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4">
        <Activity className="w-8 h-8 text-zinc-400 animate-pulse mb-2" />
        <span className="text-zinc-500 text-xs">Querying service health status...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Status Page Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm mb-5">
          The requested status page '{slug}' is either unpublished or nonexistent.
        </p>
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md text-xs hover:text-white"
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
          bg: 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400',
          icon: CheckCircle2,
          headline: 'All Systems Operational',
          subtext: 'All synthetic probes and components are passing regular health checks.'
        };
      case 'DEGRADED_PERFORMANCE':
        return {
          bg: 'bg-amber-950/30 border-amber-800/40 text-amber-400',
          icon: AlertTriangle,
          headline: 'Degraded System Performance',
          subtext: 'Some service components are experiencing intermittent latency or probe degradation.'
        };
      case 'MAJOR_OUTAGE':
        return {
          bg: 'bg-red-950/30 border-red-800/40 text-red-400',
          icon: ShieldAlert,
          headline: 'Major Service Outage Detected',
          subtext: 'Synthetic probes have detected an active incident in one or more core services.'
        };
      default:
        return {
          bg: 'bg-zinc-900/60 border-zinc-800 text-zinc-400',
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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
            </div>
            <p className="text-xs text-zinc-400">{description}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Last Updated</span>
            <span className="text-[11px] font-mono text-zinc-400">{new Date().toUTCString().slice(0, 22)} UTC</span>
          </div>
        </div>

        {/* Global Overall Status Banner */}
        <div className={`p-4 rounded-lg border flex items-center gap-3.5 ${overall.bg}`}>
          <OverallIcon className="w-6 h-6 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-white">{overall.headline}</h2>
            <p className="text-xs opacity-90 mt-0.5">{overall.subtext}</p>
          </div>
        </div>

        {/* Active Incidents Alert */}
        {activeIncidents.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Active Incidents
            </h2>
            {activeIncidents.map(inc => (
              <div key={inc.id} className="p-4 rounded-lg bg-[#12141a] border border-red-800/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{inc.componentName}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                    {inc.status}
                  </span>
                </div>
                <p className="text-zinc-200">{inc.title}</p>
                <div className="space-y-1 pt-1.5 border-t border-zinc-800 text-[11px] text-zinc-400">
                  {inc.timeline?.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-mono text-zinc-500 shrink-0">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{t.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Components Health List */}
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">System Components</h2>
            <span className="text-[11px] font-mono text-zinc-500">24h / 7d Uptime</span>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {components.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No public components configured for this status page.
              </div>
            ) : (
              components.map(c => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-white block">{c.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Last check: {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block font-mono text-[11px] text-zinc-400">
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
        <div className="bg-[#12141a] border border-zinc-800/80 rounded-lg p-4 space-y-3">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Past Incidents (7 Days)</h2>

          {pastIncidents.length === 0 ? (
            <div className="py-4 text-center text-zinc-500 text-xs">
              No service outages reported in the past 7 days.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pastIncidents.map(inc => (
                <div key={inc.id} className="p-3 rounded-md bg-[#0b0d12] border border-zinc-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{inc.componentName}</span>
                    <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{inc.title}</p>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Outage duration: {inc.durationSeconds || 0}s • Resolved at {new Date(inc.resolvedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-6 text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-zinc-500" />
          <span>PingCraft Synthetic Observability Engine</span>
        </div>
      </div>
    </div>
  );
}
