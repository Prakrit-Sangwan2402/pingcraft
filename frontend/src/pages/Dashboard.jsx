import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Search,
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
  Zap,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import MonitorModal from '../components/MonitorModal';
import InstantProbeModal from '../components/InstantProbeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Dashboard({ onSelectMonitor, onViewIncidents, onOpenGuide }) {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
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

  // Quick Seed Demo Monitors
  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await api.monitors.seedDemo();
      await fetchMonitors();
    } catch (err) {
      alert(`Error loading demo monitors: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

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
    <div className="space-y-7">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Monitors Cockpit</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time synthetic health monitoring, precision latencies & SLA metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4 text-zinc-400" />
            Instant Probe
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Monitor
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          subtext="Probes suspended"
          icon={Pause}
          tone="default"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0b0d12] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'All', value: '' },
            { label: 'Operational', value: 'OPERATIONAL' },
            { label: 'Degraded', value: 'DEGRADED' },
            { label: 'Outage', value: 'DOWN' },
            { label: 'Paused', value: 'PAUSED' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-3 text-xs text-zinc-400 self-end md:self-auto font-mono">
          <button
            onClick={() => fetchMonitors()}
            title="Refresh now"
            className="p-1.5 rounded-lg bg-[#0b0d12] border border-zinc-800 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-zinc-200' : ''}`} />
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-800 text-zinc-400 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto-poll (15s)</span>
          </label>
        </div>
      </div>

      {/* Monitor Cards List */}
      {loading && monitors.length === 0 ? (
        <div className="py-24 text-center text-zinc-400 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-3 text-zinc-300 animate-pulse" />
          Synchronizing telemetry metrics...
        </div>
      ) : monitors.length === 0 ? (
        <div className="py-20 text-center bg-[#12141c]/60 border border-dashed border-zinc-800 rounded-2xl p-8">
          <Layers className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-base font-bold text-zinc-100">
            {search || statusFilter ? 'No matching monitors found' : 'No monitors configured yet'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1 mb-6">
            {search || statusFilter
              ? 'Try adjusting your search criteria or resetting the status filter.'
              : 'Add your first synthetic endpoint to begin tracking latency, SLA uptimes, and automated incident recovery.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Your First Monitor
            </button>

            {!search && !statusFilter && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 transition-colors inline-flex items-center gap-2"
                title="Initialize with sample public API endpoints"
              >
                <Sparkles className="w-4 h-4 text-zinc-400" />
                {seeding ? 'Initializing...' : 'Load Starter Endpoints'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monitors.map(m => (
            <div
              key={m._id}
              onClick={() => onSelectMonitor(m._id)}
              className="group bg-[#12141c] hover:bg-[#161824] border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Status & Method */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <StatusBadge status={m.status} size="sm" />
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {m.method || 'GET'}
                  </span>
                </div>

                {/* Name & URL */}
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {m.name}
                </h3>
                <p className="text-xs font-mono text-zinc-400 truncate mt-1" title={m.url}>
                  {m.url}
                </p>
              </div>

              {/* Metrics row */}
              <div className="mt-4 pt-3.5 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-xs uppercase font-medium text-zinc-400">24h Uptime</span>
                  <span className="font-mono font-bold text-sm text-zinc-200 mt-0.5 block">
                    {m.uptime24h !== null && m.uptime24h !== undefined ? (
                      <span className={m.uptime24h >= 99 ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.uptime24h}%
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-sans text-xs font-normal">No data</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="block text-xs uppercase font-medium text-zinc-400">Latency</span>
                  <span className="font-mono font-bold text-sm text-zinc-200 mt-0.5 block">
                    {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? (
                      <span className="text-emerald-400">{m.lastLatencyMs} ms</span>
                    ) : (
                      <span className="text-zinc-600 font-sans text-xs font-normal">Pending</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Footer: Last Check & Controls */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleTogglePause(e, m._id)}
                    title={m.isPaused ? 'Resume monitor' : 'Pause monitor'}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {m.isPaused ? <Play className="w-4 h-4 fill-current text-emerald-400" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMonitor(m);
                    }}
                    title="Edit monitor"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    title="Delete monitor"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
        message={`Delete "${deletingMonitor?.name}"? All historical telemetry and incident audit logs will be permanently deleted.`}
        loading={deleteLoading}
      />
    </div>
  );
}
