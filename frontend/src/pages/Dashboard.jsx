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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1D2733]">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8EDF4] tracking-tight">Monitors Cockpit</h1>
          <p className="text-xs text-[#9AA8B8] mt-1">
            Real-time synthetic health monitoring, precision latencies & SLA metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#131A23] hover:bg-[#192330] text-[#E8EDF4] border border-[#263241] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#3DD6C6]" />
            Instant Probe
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] transition-colors flex items-center gap-2 shadow-sm"
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
          subtext="Probes suspended"
          icon={Pause}
          tone="default"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131A23] border border-[#263241] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#687789] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0E131A] border border-[#263241] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#E8EDF4] placeholder-[#687789] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6] font-mono"
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
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? 'bg-[#192330] text-[#E8EDF4] border border-[#263241] shadow-sm'
                  : 'text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#0E131A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-3 text-xs text-[#9AA8B8] self-end md:self-auto font-mono">
          <button
            onClick={() => fetchMonitors()}
            title="Refresh now"
            className="p-1.5 rounded-lg bg-[#0E131A] border border-[#263241] text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#192330] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3DD6C6]' : ''}`} />
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-[#0E131A] border-[#263241] text-[#3DD6C6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Auto-poll (15s)</span>
          </label>
        </div>
      </div>

      {/* Monitor List View */}
      {loading && monitors.length === 0 ? (
        <div className="py-24 text-center text-[#9AA8B8] text-xs">
          <Activity className="w-6 h-6 mx-auto mb-3 text-[#3DD6C6] animate-pulse" />
          Synchronizing telemetry metrics...
        </div>
      ) : monitors.length === 0 ? (
        <div className="py-16 text-center bg-[#131A23]/60 border border-dashed border-[#263241] rounded-xl p-8">
          <Layers className="w-10 h-10 mx-auto mb-3 text-[#687789]" />
          <h3 className="text-sm font-semibold text-[#E8EDF4]">
            {search || statusFilter ? 'No matching monitors found' : 'No monitors configured yet'}
          </h3>
          <p className="text-xs text-[#9AA8B8] max-w-md mx-auto mt-1 mb-5">
            {search || statusFilter
              ? 'Try adjusting your search criteria or resetting the status filter.'
              : 'Add your first synthetic endpoint to begin tracking latency, SLA uptimes, and automated incident recovery.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Your First Monitor
            </button>

            {!search && !statusFilter && (
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#192330] hover:bg-[#202B39] text-[#9AA8B8] hover:text-[#E8EDF4] border border-[#263241] transition-colors inline-flex items-center gap-2"
                title="Initialize with sample public API endpoints"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3DD6C6]" />
                {seeding ? 'Initializing...' : 'Load Starter Endpoints'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#131A23] border border-[#263241] rounded-xl overflow-hidden shadow-sm">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-[#0E131A] border-b border-[#1D2733] text-[11px] font-medium text-[#687789] uppercase tracking-wider">
            <div className="col-span-5">Service / Target URL</div>
            <div className="col-span-2">Health Status</div>
            <div className="col-span-2">24h Uptime</div>
            <div className="col-span-2">Last Latency</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#1D2733]">
            {monitors.map(m => (
              <div
                key={m._id}
                onClick={() => onSelectMonitor(m._id)}
                className="group px-5 py-3.5 hover:bg-[#192330]/60 transition-colors cursor-pointer flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center gap-2.5"
              >
                {/* Col 1-5: Service Name, Method & URL */}
                <div className="col-span-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#0E131A] text-[#9AA8B8] border border-[#263241] shrink-0">
                      {m.method || 'GET'}
                    </span>
                    <h3 className="text-sm font-semibold text-[#E8EDF4] group-hover:text-[#3DD6C6] transition-colors truncate">
                      {m.name}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-[#687789] truncate mt-0.5" title={m.url}>
                    {m.url}
                  </p>
                </div>

                {/* Col 6-7: Status */}
                <div className="col-span-2 flex items-center">
                  <StatusBadge status={m.status} size="sm" />
                </div>

                {/* Col 8-9: 24h Uptime */}
                <div className="col-span-2 text-xs">
                  <span className="md:hidden text-[10px] text-[#687789] uppercase mr-2 font-mono">24h Uptime:</span>
                  <span className="font-mono tabular-nums font-medium text-xs">
                    {m.uptime24h !== null && m.uptime24h !== undefined ? (
                      <span className={m.uptime24h >= 99 ? 'text-[#45D483]' : 'text-[#F2B866]'}>
                        {m.uptime24h}%
                      </span>
                    ) : (
                      <span className="text-[#687789] font-sans">No data</span>
                    )}
                  </span>
                </div>

                {/* Col 10-11: Latency & Check time */}
                <div className="col-span-2 text-xs">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums font-medium">
                    <span className="md:hidden text-[10px] text-[#687789] uppercase mr-2 font-mono">Latency:</span>
                    {m.lastLatencyMs !== null && m.lastLatencyMs !== undefined ? (
                      <span className="text-[#3DD6C6]">{m.lastLatencyMs} ms</span>
                    ) : (
                      <span className="text-[#687789] font-sans">Pending</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#687789] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#687789]" />
                    {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </span>
                </div>

                {/* Col 12: Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => handleTogglePause(e, m._id)}
                    title={m.isPaused ? 'Resume monitor' : 'Pause monitor'}
                    className="p-1.5 rounded-lg text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#202B39] transition-colors"
                  >
                    {m.isPaused ? <Play className="w-3.5 h-3.5 fill-current text-[#45D483]" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMonitor(m);
                    }}
                    title="Edit monitor"
                    className="p-1.5 rounded-lg text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#202B39] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    title="Delete monitor"
                    className="p-1.5 rounded-lg text-[#9AA8B8] hover:text-[#FF647C] hover:bg-[#202B39] transition-colors"
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
