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
      TRIGGERED: 'bg-[#C63E32]/10 text-[#C63E32] border-[#C63E32]/30',
      INVESTIGATING: 'bg-[#C17B27]/15 text-[#C17B27] border-[#C17B27]/30',
      MITIGATING: 'bg-[#726D5B]/15 text-[#252720] border-[#726D5B]/30',
      RESOLVED: 'bg-[#427A55]/15 text-[#427A55] border-[#427A55]/30'
    };
    return (
      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium border ${map[status] || map.TRIGGERED}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#D4CCBE]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Service Interruption Management
          </span>
          <h1 className="text-3xl font-serif font-normal text-[#252720] tracking-tight">Incident War Room</h1>
          <p className="text-xs text-[#77766B] mt-1">
            Outage lifecycle tracking, state machine transitions & immutable audit timelines.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['', 'TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#292B24] text-[#FAF8F2] shadow-sm'
                  : 'text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5]/60'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
          <button
            onClick={() => fetchIncidents()}
            className="p-1.5 rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5] transition-colors cursor-pointer"
            aria-label="Refresh incidents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D84A2F]' : ''}`} />
          </button>
        </div>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="py-20 text-center text-[#77766B] text-xs font-mono">
          <Activity className="w-6 h-6 mx-auto mb-2 text-[#D84A2F] animate-pulse" />
          Loading incidents telemetry...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF8F2] border border-dashed border-[#D4CCBE] rounded-sm p-8">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#427A55]" />
          <h3 className="text-base font-serif font-normal text-[#252720]">No Incidents Recorded</h3>
          <p className="text-xs text-[#77766B] max-w-sm mx-auto mt-1">
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
                  className={`p-3.5 rounded-sm border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF8F2] border-l-4 border-l-[#D84A2F] border-t-[#D4CCBE] border-r-[#D4CCBE] border-b-[#D4CCBE] shadow-sm'
                      : isResolved
                      ? 'bg-[#FAF8F2]/60 border-[#D4CCBE] opacity-80 hover:opacity-100 hover:bg-[#FAF8F2]'
                      : 'bg-[#FAF8F2] border-[#D4CCBE] hover:bg-[#E8E1D5]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-[#252720] truncate">
                      {inc.monitorId?.name || 'Monitored Service'}
                    </span>
                    {getStatusBadge(inc.status)}
                  </div>

                  <p className="text-xs text-[#77766B] line-clamp-2">
                    {inc.triggerReason}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#77766B] mt-2.5 pt-2 border-t border-[#D4CCBE] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#77766B]" />
                      {new Date(inc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      {isResolved
                        ? `Downtime: ${inc.durationSeconds || 0}s`
                        : <span className="text-[#C63E32] font-semibold">Active Outage</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incident Details & Timeline Column */}
          <div className="lg:col-span-7">
            {activeIncident ? (
              <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-5 space-y-5 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#D4CCBE]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-serif font-normal text-[#252720]">
                        {activeIncident.monitorId?.name || 'Component Incident'}
                      </h2>
                      {getStatusBadge(activeIncident.status)}
                    </div>
                    <p className="text-xs text-[#77766B]">
                      {activeIncident.triggerReason}
                    </p>
                  </div>

                  {activeIncident.monitorId?._id && (
                    <button
                      onClick={() => onSelectMonitor(activeIncident.monitorId._id)}
                      className="px-2.5 py-1.5 rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] text-[#252720] hover:bg-[#E8E1D5] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#D84A2F]" />
                      View Monitor
                    </button>
                  )}
                </div>

                {/* Duration & Details Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-sm bg-[#E8E1D5]/60 border border-[#D4CCBE] text-xs font-mono">
                  <div>
                    <span className="block text-[#77766B] text-[9px] uppercase tracking-wider font-mono">First Outage Check</span>
                    <span className="text-[#252720] text-xs font-semibold tabular-nums">
                      {new Date(activeIncident.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#77766B] text-[9px] uppercase tracking-wider font-mono">Triggered At</span>
                    <span className="text-[#252720] text-xs font-semibold tabular-nums">
                      {new Date(activeIncident.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#77766B] text-[9px] uppercase tracking-wider font-mono">Total Downtime</span>
                    <span className="font-semibold text-[#252720] text-xs tabular-nums">
                      {activeIncident.durationSeconds !== null && activeIncident.durationSeconds !== undefined
                        ? `${activeIncident.durationSeconds}s`
                        : <span className="text-[#C63E32]">Ongoing</span>}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Controls (if not resolved) */}
                {activeIncident.status !== 'RESOLVED' && (
                  <div className="p-3.5 rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] space-y-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#77766B] block">
                      State Transition Controls
                    </span>

                    <textarea
                      rows={2}
                      value={transitionNote}
                      onChange={e => setTransitionNote(e.target.value)}
                      placeholder="Add an update note or root cause analysis to the timeline..."
                      className="w-full bg-[#FFFFFF] border border-[#D4CCBE] rounded-sm p-2.5 text-xs text-[#252720] placeholder-[#77766B] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-sans"
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {activeIncident.status === 'TRIGGERED' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('INVESTIGATING')}
                          className="px-3.5 py-1.5 rounded-sm bg-[#292B24] hover:bg-[#3D4036] text-[#FAF8F2] text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Acknowledge & Investigate
                        </button>
                      )}

                      {activeIncident.status === 'INVESTIGATING' && (
                        <button
                          disabled={updating}
                          onClick={() => handleTransition('MITIGATING')}
                          className="px-3.5 py-1.5 rounded-sm bg-[#292B24] hover:bg-[#3D4036] text-[#FAF8F2] text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Apply Mitigation Fix
                        </button>
                      )}

                      <button
                        disabled={updating}
                        onClick={() => handleTransition('RESOLVED')}
                        className="px-3.5 py-1.5 rounded-sm bg-[#427A55] hover:bg-[#427A55]/90 text-white text-xs font-mono font-medium transition-colors disabled:opacity-50 ml-auto cursor-pointer"
                      >
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#77766B] mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#77766B]" /> Immutable Audit Timeline
                  </h3>

                  <div className="space-y-3.5 pl-3 border-l border-[#D4CCBE] relative">
                    {activeIncident.timeline?.map((evt, idx) => (
                      <div key={idx} className="relative pl-3.5 text-xs space-y-1">
                        <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#D84A2F] ring-4 ring-[#FAF8F2]" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#252720] text-xs font-mono">{evt.status}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] text-[#252720] border border-[#D4CCBE]">
                            {evt.actor}
                          </span>
                          <span className="text-[10px] text-[#77766B] font-mono ml-auto">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[#77766B] bg-[#E8E1D5]/50 p-2.5 rounded-sm border border-[#D4CCBE] leading-relaxed text-[11px] font-mono">
                          {evt.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-[#77766B] text-xs bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm font-mono">
                Select an incident from the list to view its audit timeline and response controls.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
