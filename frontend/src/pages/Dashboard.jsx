import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Zap
} from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import MonitorModal from '../components/MonitorModal';
import InstantProbeModal from '../components/InstantProbeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Dashboard({ onSelectMonitor, onViewIncidents }) {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [isInstantProbeOpen, setIsInstantProbeOpen] = useState(false);
  const [deletingMonitor, setDeletingMonitor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMonitors = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.monitors.getAll(params);
      if (res.success && res.data) {
        setMonitors(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // Periodic polling auto-refresh (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMonitors();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMonitors]);

  // Handle Pause/Resume
  const handleTogglePause = async (e, monitorId) => {
    e.stopPropagation();
    try {
      await api.monitors.togglePause(monitorId);
      fetchMonitors();
    } catch (err) {
      alert(`Error toggling pause state: ${err.message}`);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingMonitor) return;
    setDeleteLoading(true);
    try {
      await api.monitors.delete(deletingMonitor._id);
      setDeletingMonitor(null);
      fetchMonitors();
    } catch (err) {
      alert(`Error deleting monitor: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute stats
  const totalCount = monitors.length;
  const operationalCount = monitors.filter(m => m.status === 'OPERATIONAL').length;
  const degradedCount = monitors.filter(m => m.status === 'DEGRADED').length;
  const downCount = monitors.filter(m => m.status === 'DOWN').length;
  const pausedCount = monitors.filter(m => m.status === 'PAUSED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Monitors Cockpit</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time health telemetry, continuous synthetic probes, and SLA threshold tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Instant Probe
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Monitor
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <MetricCard
          title="Total Monitors"
          value={totalCount}
          subtext="Active synthetic monitors"
          icon={Layers}
          tone="default"
        />
        <MetricCard
          title="Operational"
          value={operationalCount}
          subtext="Passing all SLA checks"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          title="Degraded"
          value={degradedCount}
          subtext="Initial check failure"
          icon={AlertTriangle}
          tone="warning"
        />
        <MetricCard
          title="Major Outages"
          value={downCount}
          subtext="Failure SLA breached"
          icon={ShieldAlert}
          tone="danger"
        />
        <MetricCard
          title="Paused"
          value={pausedCount}
          subtext="Scheduler probes disabled"
          icon={Pause}
          tone="default"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'All', value: '' },
            { label: 'Operational', value: 'OPERATIONAL' },
            { label: 'Degraded', value: 'DEGRADED' },
            { label: 'Down', value: 'DOWN' },
            { label: 'Paused', value: 'PAUSED' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-2 text-xs text-slate-400 self-end md:self-auto">
          <button
            onClick={() => fetchMonitors()}
            title="Refresh now"
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto-refresh (15s)</span>
          </label>
        </div>
      </div>

      {/* Monitor Cards List */}
      {loading && monitors.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-500 animate-pulse" />
          Loading monitors telemetry...
        </div>
      ) : monitors.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <Layers className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-300">No monitors found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter
              ? 'No monitors match your current search and status filters.'
              : 'You have not added any synthetic monitors yet. Start monitoring your first endpoint now!'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add First Monitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monitors.map(m => (
            <div
              key={m._id}
              onClick={() => onSelectMonitor(m._id)}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Status & Method */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <StatusBadge status={m.status} size="sm" />
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                    {m.method || 'GET'}
                  </span>
                </div>

                {/* Name & URL */}
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                  {m.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 truncate mt-0.5" title={m.url}>
                  {m.url}
                </p>
              </div>

              {/* Metrics row */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">24h Uptime</span>
                  <span className="font-mono font-bold text-slate-200">
                    {m.uptime24h !== null && m.uptime24h !== undefined ? (
                      <span className={m.uptime24h >= 99 ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.uptime24h}%
                      </span>
                    ) : (
                      <span className="text-slate-500 font-normal">No data</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">Last Latency</span>
                  <span className="font-mono font-bold text-slate-200">
                    {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? (
                      <span className="text-emerald-400">{m.lastLatencyMs} ms</span>
                    ) : (
                      <span className="text-slate-500 font-normal">Pending</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Footer: Last Check time & Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString() : 'Never'}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleTogglePause(e, m._id)}
                    title={m.isPaused ? 'Resume monitor' : 'Pause monitor'}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  >
                    {m.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMonitor(m);
                    }}
                    title="Edit monitor"
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    title="Delete monitor"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <MonitorModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={fetchMonitors}
      />

      <MonitorModal
        isOpen={Boolean(editingMonitor)}
        monitor={editingMonitor}
        onClose={() => setEditingMonitor(null)}
        onSaved={fetchMonitors}
      />

      <InstantProbeModal
        isOpen={isInstantProbeOpen}
        onClose={() => setIsInstantProbeOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingMonitor)}
        onClose={() => setDeletingMonitor(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Monitor"
        message={`Are you sure you want to delete "${deletingMonitor?.name}"? All historical ping telemetry, response metrics, and incidents associated with this monitor will be permanently removed.`}
        loading={deleteLoading}
      />
    </div>
  );
}
