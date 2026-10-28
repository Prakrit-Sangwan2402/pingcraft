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
      TRIGGERED: 'bg-[#FF647C]/10 text-[#FF647C] border-[#FF647C]/25',
      INVESTIGATING: 'bg-[#F2B866]/10 text-[#F2B866] border-[#F2B866]/25',
      MITIGATING: 'bg-[#72B7FF]/10 text-[#72B7FF] border-[#72B7FF]/25',
      RESOLVED: 'bg-[#45D483]/10 text-[#45D483] border-[#45D483]/25'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${map[status] || map.TRIGGERED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1D2733]">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF4] tracking-tight">Incident War Room</h1>
          <p className="text-xs text-[#9AA8B8] mt-1">
            Outage lifecycle tracking, state machine transitions & immutable audit timelines.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5">
          {['', 'TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-[#192330] text-[#E8EDF4] border border-[#263241]'
                  : 'text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#131A23]'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
          <button
            onClick={() => fetchIncidents()}
            className="p-1.5 rounded-lg bg-[#131A23] border border-[#263241] text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#192330] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3DD6C6]' : ''}`} />
          </button>
        </div>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="py-20 text-center text-[#9AA8B8] text-xs">
          <Activity className="w-6 h-6 mx-auto mb-2 text-[#3DD6C6] animate-pulse" />
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center bg-[#131A23]/60 border border-dashed border-[#263241] rounded-xl p-8">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#45D483]" />
          <h3 className="text-sm font-semibold text-[#E8EDF4]">No Incidents Recorded</h3>
          <p className="text-xs text-[#9AA8B8] max-w-sm mx-auto mt-1">
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
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#192330] border-[#3DD6C6]/40 shadow-sm'
                      : isResolved
                      ? 'bg-[#131A23]/60 border-[#263241] opacity-75 hover:opacity-100 hover:border-[#202B39]'
                      : 'bg-[#131A23] border-[#263241] hover:border-[#202B39]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#E8EDF4] truncate">
                      {inc.monitorId?.name || 'Monitored Service'}
                    </span>
                    {getStatusBadge(inc.status)}
                  </div>

                  <p className="text-xs text-[#9AA8B8] line-clamp-2">
                    {inc.triggerReason}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#687789] mt-3 pt-2.5 border-t border-[#1D2733] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#687789]" />
                      {new Date(inc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      {isResolved
                        ? `Downtime: ${inc.durationSeconds || 0}s`
                        : <span className="text-[#FF647C] font-semibold">Active Outage</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Details & Timeline Column */}
          <div className="lg:col-span-7">
            {activeIncident ? (
              <div className="bg-[#131A23] border border-[#263241] rounded-xl p-5 space-y-5 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1D2733]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold text-[#E8EDF4]">
                        {activeIncident.monitorId?.name || 'Component Incident'}
                      </h2>
                      {getStatusBadge(activeIncident.status)}
                    </div>
                    <p className="text-xs text-[#9AA8B8]">
                      {activeIncident.triggerReason}
                    </p>
                  </div>

                  {activeIncident.monitorId?._id && (
                    <button
                      onClick={() => onSelectMonitor(activeIncident.monitorId._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0E131A] border border-[#263241] text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#192330] text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#3DD6C6]" />
                      View Monitor
                    </button>
                  )}
                </div>

                {/* Duration & Details Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#0E131A] border border-[#263241] text-xs font-mono">
                  <div>
                    <span className="block text-[#687789] text-[10px] uppercase font-sans">First Outage Check</span>
                    <span className="text-[#E8EDF4] text-xs font-medium">
                      {new Date(activeIncident.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#687789] text-[10px] uppercase font-sans">Triggered At</span>
                    <span className="text-[#E8EDF4] text-xs font-medium">
                      {new Date(activeIncident.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#687789] text-[10px] uppercase font-sans">Total Downtime</span>
                    <span className="font-semibold text-[#F2B866] text-xs">
                      {activeIncident.durationSeconds !== null && activeIncident.durationSeconds !== undefined
                        ? `${activeIncident.durationSeconds}s`
                        : <span className="text-[#FF647C]">Ongoing</span>}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Controls (if not resolved) */}
                {activeIncident.status !== 'RESOLVED' && (
                  <div className="p-3.5 rounded-lg bg-[#0E131A] border border-[#263241] space-y-2.5">
                    <span className="text-[11px] font-medium text-[#9AA8B8] uppercase tracking-wide block font-mono">
                      State Transition Controls
                    </span>

                    <textarea
                      rows={2}
                      value={transitionNote}
                      onChange={e => setTransitionNote(e.target.value)}
                      placeholder="Add an update note or root cause analysis to the timeline..."
                      className="w-full bg-[#131A23] border border-[#263241] rounded-lg p-2.5 text-xs text-[#E8EDF4] placeholder-[#687789] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-sans"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeIncident.status === 'TRIGGERED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('INVESTIGATING')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#192330] hover:bg-[#202B39] text-[#E8EDF4] border border-[#263241] text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Acknowledge & Investigate
                        </button>
                      )}

                      {activeIncident.status === 'INVESTIGATING' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('MITIGATING')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#192330] hover:bg-[#202B39] text-[#E8EDF4] border border-[#263241] text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Apply Mitigation Fix
                        </button>
                      )}

                      <button
                        disabled={updating}
                        onClick={() => handleTransition('RESOLVED')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#45D483] hover:bg-[#45D483]/90 text-[#0B0F14] text-xs font-semibold transition-colors disabled:opacity-50 ml-auto"
                      >
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-[#9AA8B8] mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#687789]" /> Immutable Audit Timeline
                  </h3>

                  <div className="space-y-3.5 pl-3 border-l border-[#1D2733] relative">
                    {activeIncident.timeline?.map((evt, idx) => (
                      <div key={idx} className="relative pl-3.5 text-xs space-y-1">
                        <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#3DD6C6] ring-4 ring-[#131A23]" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#E8EDF4] text-xs">{evt.status}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0E131A] text-[#9AA8B8] border border-[#263241]">
                            {evt.actor}
                          </span>
                          <span className="text-[10px] text-[#687789] font-mono ml-auto">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[#9AA8B8] bg-[#0E131A] p-2.5 rounded-lg border border-[#263241] leading-relaxed text-[11px]">
                          {evt.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-[#687789] text-xs bg-[#131A23]/60 border border-[#263241] rounded-xl">
                Select an incident from the list to view its audit timeline and response controls.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
