import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  ArrowRight
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
      TRIGGERED: 'bg-red-950/40 text-red-400 border-red-800/50',
      INVESTIGATING: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
      MITIGATING: 'bg-sky-950/40 text-sky-400 border-sky-800/50',
      RESOLVED: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${map[status] || map.TRIGGERED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Incident War Room</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Outage lifecycle tracking, state machine transitions & audit timelines.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5">
          {['', 'TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
          <button
            onClick={() => fetchIncidents()}
            className="p-1 rounded-md bg-[#0b0d12] border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-300' : ''}`} />
          </button>
        </div>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs">
          <Activity className="w-6 h-6 mx-auto mb-2 text-zinc-400 animate-pulse" />
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center bg-[#12141a]/60 border border-dashed border-zinc-800 rounded-xl">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
          <h3 className="text-sm font-semibold text-zinc-200">No Incidents Recorded</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            {statusFilter
              ? `No incidents matching status filter '${statusFilter}'.`
              : 'All monitored endpoints are operating within SLAs. No outages detected.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Incident List Column */}
          <div className="lg:col-span-5 space-y-2.5">
            {incidents.map(inc => {
              const isSelected = activeIncident?._id === inc._id;
              const isResolved = inc.status === 'RESOLVED';
              return (
                <div
                  key={inc._id}
                  onClick={() => setActiveIncident(inc)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#161821] border-zinc-650'
                      : 'bg-[#12141a] border-zinc-800/80 hover:border-zinc-750'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {inc.monitorId?.name || 'Monitored Service'}
                    </span>
                    {getStatusBadge(inc.status)}
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {inc.triggerReason}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2.5 pt-2 border-t border-zinc-800/60 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {new Date(inc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      {isResolved
                        ? `Downtime: ${inc.durationSeconds || 0}s`
                        : 'Active Outage'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Details & Timeline Column */}
          <div className="lg:col-span-7">
            {activeIncident ? (
              <div className="bg-[#12141a] border border-zinc-800 rounded-lg p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-white">
                        {activeIncident.monitorId?.name || 'Component Incident'}
                      </h2>
                      {getStatusBadge(activeIncident.status)}
                    </div>
                    <p className="text-xs text-zinc-300">
                      {activeIncident.triggerReason}
                    </p>
                  </div>

                  {activeIncident.monitorId?._id && (
                    <button
                      onClick={() => onSelectMonitor(activeIncident.monitorId._id)}
                      className="px-2.5 py-1 rounded-md bg-[#0b0d12] border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      View Monitor
                    </button>
                  )}
                </div>

                {/* Duration & Details Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-md bg-[#0b0d12] border border-zinc-800/80 text-xs font-mono">
                  <div>
                    <span className="block text-zinc-500 text-[10px] uppercase font-sans">First Outage Check</span>
                    <span className="text-zinc-300 text-xs">
                      {new Date(activeIncident.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-[10px] uppercase font-sans">Triggered At</span>
                    <span className="text-zinc-300 text-xs">
                      {new Date(activeIncident.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-[10px] uppercase font-sans">Total Downtime</span>
                    <span className="font-semibold text-amber-400 text-xs">
                      {activeIncident.durationSeconds !== null && activeIncident.durationSeconds !== undefined
                        ? `${activeIncident.durationSeconds}s`
                        : 'Ongoing'}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Controls (if not resolved) */}
                {activeIncident.status !== 'RESOLVED' && (
                  <div className="p-3.5 rounded-md bg-[#0b0d12] border border-zinc-800 space-y-2.5">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide block font-mono">
                      State Transition Controls
                    </span>

                    <textarea
                      rows={2}
                      value={transitionNote}
                      onChange={e => setTransitionNote(e.target.value)}
                      placeholder="Add an update note or root cause analysis to the timeline..."
                      className="w-full bg-[#12141a] border border-zinc-800 rounded-md p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-sans"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeIncident.status === 'TRIGGERED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('INVESTIGATING')}
                          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Acknowledge & Investigate
                        </button>
                      )}

                      {activeIncident.status === 'INVESTIGATING' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('MITIGATING')}
                          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Apply Mitigation Fix
                        </button>
                      )}

                      <button
                        disabled={updating}
                        onClick={() => handleTransition('RESOLVED')}
                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
                      >
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> Immutable Timeline
                  </h3>

                  <div className="space-y-3 pl-3 border-l border-zinc-800 relative">
                    {activeIncident.timeline?.map((evt, idx) => (
                      <div key={idx} className="relative pl-3.5 text-xs space-y-1">
                        <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-600 ring-4 ring-[#12141a]" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200 text-xs">{evt.status}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0b0d12] text-zinc-400 border border-zinc-800">
                            {evt.actor}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-zinc-400 bg-[#0b0d12] p-2 rounded border border-zinc-800/80 leading-relaxed text-[11px]">
                          {evt.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500 text-xs bg-[#12141a]/60 border border-zinc-800 rounded-lg">
                Select an incident from the list to view its audit timeline and response controls.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
