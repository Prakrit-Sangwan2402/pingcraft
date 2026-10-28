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
    <div className="space-y-6 font-sans">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#D4CCBE]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D84A2F] block mb-1">
            Telemetry Register
          </span>
          <h1 className="text-3xl font-serif font-normal text-[#252720] tracking-tight">Monitors Cockpit</h1>
          <p className="text-xs text-[#77766B] mt-1">
            Continuous synthetic probes, high-precision latency measurement & SLA metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-3.5 py-1.5 text-xs font-mono rounded-sm bg-[#FAF8F2] hover:bg-[#E8E1D5] text-[#252720] border border-[#D4CCBE] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#D84A2F]" />
            Instant Probe
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-1.5 text-xs font-medium rounded-sm bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
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
          subtext="Active synthetic targets"
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
      <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#77766B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm pl-9 pr-3 py-1.5 text-xs text-[#252720] placeholder-[#77766B] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
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
              className={`px-3 py-1 text-xs rounded-sm font-mono transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-[#292B24] text-[#FAF8F2] shadow-sm'
                  : 'text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5]/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-3 text-xs text-[#77766B] self-end md:self-auto font-mono">
          <button
            onClick={() => fetchMonitors()}
            title="Refresh now"
            className="p-1.5 rounded-sm bg-[#FAF8F2] border border-[#D4CCBE] text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D84A2F]' : ''}`} />
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded-sm bg-[#FAF8F2] border-[#D4CCBE] text-[#D84A2F] focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-[#D84A2F]"
            />
            <span>Auto-poll (15s)</span>
          </label>
        </div>
      </div>

      {/* Monitor List View */}
      {loading && monitors.length === 0 ? (
        <div className="py-24 text-center text-[#77766B] text-xs font-mono">
          <Activity className="w-6 h-6 mx-auto mb-3 text-[#D84A2F] animate-pulse" />
          Synchronizing telemetry metrics...
        </div>
      ) : monitors.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF8F2] border border-dashed border-[#D4CCBE] rounded-sm p-8">
          <Layers className="w-10 h-10 mx-auto mb-3 text-[#77766B]" />
          <h3 className="text-base font-serif font-normal text-[#252720]">
            {search || statusFilter ? 'No matching monitors found' : 'No monitors configured yet'}
          </h3>
          <p className="text-xs text-[#77766B] max-w-md mx-auto mt-1 mb-5">
            {search || statusFilter
              ? 'Try adjusting your search query or resetting the filter options.'
              : 'Add your first synthetic endpoint to begin tracking latency, availability SLAs, and automated incident recovery.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-xs font-medium rounded-sm bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white transition-colors inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Your First Monitor
            </button>

            {!search && !statusFilter && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="px-3.5 py-2 text-xs font-mono rounded-sm bg-[#FAF8F2] hover:bg-[#E8E1D5] text-[#77766B] hover:text-[#252720] border border-[#D4CCBE] transition-colors inline-flex items-center gap-2 cursor-pointer"
                title="Initialize with sample public API endpoints"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D84A2F]" />
                {seeding ? 'Initializing...' : 'Load Starter Endpoints'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm overflow-hidden shadow-sm">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-[#E8E1D5]/60 border-b border-[#D4CCBE] text-[10px] font-mono text-[#77766B] uppercase tracking-wider">
            <div className="col-span-5">Service / Target Endpoint</div>
            <div className="col-span-2">Health Status</div>
            <div className="col-span-2">24h Uptime</div>
            <div className="col-span-2">Last Latency</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#D4CCBE]">
            {monitors.map(m => (
              <div
                key={m._id}
                onClick={() => onSelectMonitor(m._id)}
                className="group px-5 py-3 hover:bg-[#E8E1D5]/40 transition-colors cursor-pointer flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center gap-2"
              >
                {/* Col 1-5: Service Name, Method & URL */}
                <div className="col-span-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#E8E1D5] text-[#252720] border border-[#D4CCBE] shrink-0">
                      {m.method || 'GET'}
                    </span>
                    <h3 className="text-sm font-medium text-[#252720] group-hover:text-[#D84A2F] transition-colors truncate">
                      {m.name}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-[#77766B] truncate mt-0.5" title={m.url}>
                    {m.url}
                  </p>
                </div>

                {/* Col 6-7: Status */}
                <div className="col-span-2 flex items-center">
                  <StatusBadge status={m.status} size="sm" />
                </div>

                {/* Col 8-9: 24h Uptime */}
                <div className="col-span-2 text-xs">
                  <span className="md:hidden text-[10px] text-[#77766B] uppercase mr-2 font-mono">24h Uptime:</span>
                  <span className="font-mono tabular-nums font-semibold text-xs">
                    {m.uptime24h !== null && m.uptime24h !== undefined ? (
                      <span className={m.uptime24h >= 99 ? 'text-[#427A55]' : 'text-[#C17B27]'}>
                        {m.uptime24h}%
                      </span>
                    ) : (
                      <span className="text-[#77766B] font-sans font-normal">No data</span>
                    )}
                  </span>
                </div>

                {/* Col 10-11: Latency & Check time */}
                <div className="col-span-2 text-xs">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums font-semibold">
                    <span className="md:hidden text-[10px] text-[#77766B] uppercase mr-2 font-mono">Latency:</span>
                    {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? (
                      <span className="text-[#252720]">{m.lastLatencyMs} ms</span>
                    ) : (
                      <span className="text-[#77766B] font-sans font-normal">Pending</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#77766B] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#77766B]" />
                    {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </span>
                </div>

                {/* Col 12: Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleTogglePause(e, m._id)}
                    title={m.isPaused ? 'Resume monitor' : 'Pause monitor'}
                    className="p-1.5 rounded-sm text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5] transition-colors cursor-pointer"
                  >
                    {m.isPaused ? <Play className="w-3.5 h-3.5 fill-current text-[#427A55]" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMonitor(m);
                    }}
                    title="Edit monitor"
                    className="p-1.5 rounded-sm text-[#77766B] hover:text-[#252720] hover:bg-[#E8E1D5] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    title="Delete monitor"
                    className="p-1.5 rounded-sm text-[#77766B] hover:text-[#C63E32] hover:bg-[#E8E1D5] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
