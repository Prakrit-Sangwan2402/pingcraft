import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Filter,
  RefreshCw,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../api/client';

export default function IncidentsPage({ selectedIncidentId = null, onSelectMonitor }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeIncident, setActiveIncident] = useState(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.incidents.getAll(params);
      if (res.success && res.data) {
        setIncidents(res.data);
        if (selectedIncidentId) {
          const match = res.data.find(i => i._id === selectedIncidentId);
          if (match) setActiveIncident(match);
        } else if (!activeIncident && res.data.length > 0) {
          setActiveIncident(res.data[0]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedIncidentId]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleTransition = async (nextStatus) => {
    if (!activeIncident) return;
    setUpdating(true);
    try {
      const res = await api.incidents.updateStatus(activeIncident._id, {
        nextStatus,
        message: transitionNote.trim() || undefined
      });
      if (res.success && res.data) {
        setActiveIncident(res.data);
        setTransitionNote('');
        fetchIncidents();
      }
    } catch (err) {
      alert(`Transition error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      TRIGGERED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      INVESTIGATING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      MITIGATING: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      RESOLVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.TRIGGERED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Incident War Room</h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated outage detection, incident state machine, and response audit trails.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          {['', 'TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === '' ? 'All Incidents' : st}
            </button>
          ))}
          <button
            onClick={() => fetchIncidents()}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="py-24 text-center text-slate-500 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-500 animate-pulse" />
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <h3 className="text-base font-semibold text-slate-200">No Incidents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {statusFilter
              ? `No incidents matching status filter '${statusFilter}'.`
              : 'All monitored endpoints are operating within SLAs. No outages detected.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incident List Column */}
          <div className="lg:col-span-5 space-y-3">
            {incidents.map(inc => {
              const isSelected = activeIncident?._id === inc._id;
              const isResolved = inc.status === 'RESOLVED';
              return (
                <div
                  key={inc._id}
                  onClick={() => setActiveIncident(inc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {inc.monitorId?.name || 'Monitored Component'}
                    </span>
                    {getStatusBadge(inc.status)}
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-2">
                    {inc.triggerReason}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(inc.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span>
                      {isResolved
                        ? `Downtime: ${inc.durationSeconds || 0}s`
                        : 'Outage Ongoing'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Details & Timeline Column */}
          <div className="lg:col-span-7">
            {activeIncident ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-lg font-bold text-white">
                        {activeIncident.monitorId?.name || 'Component Incident'}
                      </h2>
                      {getStatusBadge(activeIncident.status)}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {activeIncident.triggerReason}
                    </p>
                  </div>

                  {activeIncident.monitorId?._id && (
                    <button
                      onClick={() => onSelectMonitor(activeIncident.monitorId._id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      View Monitor
                    </button>
                  )}
                </div>

                {/* Duration & Key Details Grid */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="block text-slate-500 text-[11px]">First Outage Check</span>
                    <span className="font-mono text-slate-300">
                      {new Date(activeIncident.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[11px]">Incident Triggered</span>
                    <span className="font-mono text-slate-300">
                      {new Date(activeIncident.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[11px]">Total Outage Duration</span>
                    <span className="font-mono font-bold text-amber-400">
                      {activeIncident.durationSeconds !== null && activeIncident.durationSeconds !== undefined
                        ? `${activeIncident.durationSeconds} seconds`
                        : 'Outage Active'}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Controls (if not resolved) */}
                {activeIncident.status !== 'RESOLVED' && (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Respond & Transition Status
                    </span>

                    <textarea
                      rows={2}
                      value={transitionNote}
                      onChange={e => setTransitionNote(e.target.value)}
                      placeholder="Add an update note or root-cause explanation for the timeline..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeIncident.status === 'TRIGGERED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('INVESTIGATING')}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Acknowledge & Investigate
                        </button>
                      )}

                      {activeIncident.status === 'INVESTIGATING' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('MITIGATING')}
                          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Apply Mitigation Fix
                        </button>
                      )}

                      <button
                        disabled={updating}
                        onClick={() => handleTransition('RESOLVED')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 ml-auto"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Append-Only Incident Timeline
                  </h3>

                  <div className="space-y-4 pl-3 border-l-2 border-slate-800 relative">
                    {activeIncident.timeline?.map((evt, idx) => (
                      <div key={idx} className="relative pl-4 text-xs space-y-1">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{evt.status}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {evt.actor}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono ml-auto">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          {evt.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-sm bg-slate-900/40 border border-slate-800 rounded-2xl">
                Select an incident from the list to view its audit timeline and response controls.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
