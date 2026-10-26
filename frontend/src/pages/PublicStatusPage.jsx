import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Activity className="w-10 h-10 text-indigo-500 animate-pulse mb-3" />
        <span className="text-slate-400 text-sm">Loading system status...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">Status Page Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          The requested status page '{slug}' does not exist or has been unpublished by its owner.
        </p>
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs hover:text-white"
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
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          icon: CheckCircle2,
          headline: 'All Systems Operational',
          subtext: 'All synthetic probes and components are passing regular health checks.'
        };
      case 'DEGRADED_PERFORMANCE':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          icon: AlertTriangle,
          headline: 'Degraded System Performance',
          subtext: 'Some service components are experiencing intermittent latency or probe degradation.'
        };
      case 'MAJOR_OUTAGE':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          icon: ShieldAlert,
          headline: 'Major Service Outage Detected',
          subtext: 'Our automated synthetic probes have detected an active incident in one or more core services.'
        };
      default:
        return {
          bg: 'bg-slate-800/40 border-slate-700 text-slate-300',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            </div>
            <p className="text-xs text-slate-400">{description}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-mono text-slate-500 uppercase block">Last Updated</span>
            <span className="text-xs font-mono text-slate-400">{new Date().toUTCString().slice(0, 22)} UTC</span>
          </div>
        </div>

        {/* Global Overall Status Banner */}
        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${overall.bg}`}>
          <div className="p-2.5 rounded-xl bg-slate-950/40 shrink-0">
            <OverallIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{overall.headline}</h2>
            <p className="text-xs opacity-90 mt-0.5">{overall.subtext}</p>
          </div>
        </div>

        {/* Active Incidents Alert */}
        {activeIncidents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Active Incidents Under Investigation
            </h2>
            {activeIncidents.map(inc => (
              <div key={inc.id} className="p-5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{inc.componentName}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">{inc.title}</p>
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {inc.timeline?.map((t, i) => (
                    <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Monitored Service Components</h2>
            <span className="text-xs text-slate-400">24h / 7d Uptime SLAs</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {components.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No public components configured for this status page.
              </div>
            ) : (
              components.map(c => (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold text-white block">{c.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Last probe: {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase text-slate-500 block font-semibold">24h / 7d</span>
                      <span className="font-mono text-xs text-slate-300">
                        {c.uptime24h !== null && c.uptime24h !== undefined ? `${c.uptime24h}%` : '—'} /{' '}
                        {c.uptime7d !== null && c.uptime7d !== undefined ? `${c.uptime7d}%` : '—'}
                      </span>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Resolved Incidents (Last 7 Days) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white">Past Incidents (Last 7 Days)</h2>

          {pastIncidents.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              No incidents reported in the past 7 days. All monitored services operating smoothly.
            </div>
          ) : (
            <div className="space-y-4">
              {pastIncidents.map(inc => (
                <div key={inc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{inc.componentName}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{inc.title}</p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Outage duration: {inc.durationSeconds || 0}s • Resolved at {new Date(inc.resolvedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-900 text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>Powered by <b>PingCraft</b> Synthetic Monitoring Platform</span>
        </div>
      </div>
    </div>
  );
}
