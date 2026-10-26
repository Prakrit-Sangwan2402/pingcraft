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
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Monitors Cockpit</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time synthetic health monitoring, precision latencies & SLA metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalCount === 0 && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {seeding ? 'Loading Demo...' : 'Load Sample Endpoints'}
            </button>
          )}

          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            Instant Probe
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-950 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Monitor
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0b0d12] border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-2.5 text-xs text-zinc-400 self-end md:self-auto font-mono">
          <button
            onClick={() => fetchMonitors()}
            title="Refresh now"
            className="p-1 rounded-md bg-[#0b0d12] border border-zinc-800 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-300' : ''}`} />
          </button>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-800 text-zinc-400 focus:ring-0 w-3 h-3"
            />
            <span>Auto-poll (15s)</span>
          </label>
        </div>
      </div>

      {/* Monitor Cards List */}
      {loading && monitors.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 text-xs">
          <Activity className="w-6 h-6 mx-auto mb-2 text-zinc-400 animate-pulse" />
          Synchronizing telemetry metrics...
        </div>
      ) : monitors.length === 0 ? (
        <div className="py-16 text-center bg-[#12141a]/60 border border-dashed border-zinc-800 rounded-xl">
          <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
          <h3 className="text-sm font-semibold text-zinc-200">No monitors configured</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            {search || statusFilter
              ? 'No monitors match your search query.'
              : 'Add your first synthetic endpoint or load our sample suite with one click.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white hover:bg-zinc-200 text-zinc-950 transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {seeding ? 'Loading...' : 'Load Sample Monitors'}
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Custom
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {monitors.map(m => (
            <div
              key={m._id}
              onClick={() => onSelectMonitor(m._id)}
              className="group bg-[#12141a] hover:bg-[#151821] border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-4 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Status & Method */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <StatusBadge status={m.status} size="sm" />
                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-750">
                    {m.method || 'GET'}
                  </span>
                </div>

                {/* Name & URL */}
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                  {m.name}
                </h3>
                <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5" title={m.url}>
                  {m.url}
                </p>
              </div>

              {/* Metrics row */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800/70 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-medium text-zinc-400">24h Uptime</span>
                  <span className="font-mono font-medium text-zinc-200">
                    {m.uptime24h !== null && m.uptime24h !== undefined ? (
                      <span className={m.uptime24h >= 99 ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.uptime24h}%
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-sans text-[11px]">No data</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-medium text-zinc-400">Latency</span>
                  <span className="font-mono font-medium text-zinc-200">
                    {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? (
                      <span className="text-emerald-400">{m.lastLatencyMs} ms</span>
                    ) : (
                      <span className="text-zinc-600 font-sans text-[11px]">Pending</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Footer: Last Check & Controls */}
              <div className="mt-3.5 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleTogglePause(e, m._id)}
                    title={m.isPaused ? 'Resume monitor' : 'Pause monitor'}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  >
                    {m.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMonitor(m);
                    }}
                    title="Edit monitor"
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    title="Delete monitor"
                    className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
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
        message={`Delete "${deletingMonitor?.name}"? All historical telemetry and incident audit logs will be permanently deleted.`}
        loading={deleteLoading}
      />
    </div>
  );
}
