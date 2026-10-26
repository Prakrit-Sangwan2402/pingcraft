import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import LatencyChart from '../components/LatencyChart';
import MonitorModal from '../components/MonitorModal';
import InstantProbeModal from '../components/InstantProbeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function MonitorDetail({ monitorId, onBack, onViewIncident }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginated Ping Logs
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInstantProbeOpen, setIsInstantProbeOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.monitors.getById(monitorId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [monitorId]);

  const fetchLogs = useCallback(async (pageNum = 1) => {
    setLogsLoading(true);
    try {
      const res = await api.monitors.getLogs(monitorId, { page: pageNum, limit: 15 });
      if (res.success && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLogsLoading(false);
    }
  }, [monitorId]);

  useEffect(() => {
    fetchDetail();
    fetchLogs(1);
  }, [fetchDetail, fetchLogs]);

  const handleTogglePause = async () => {
    try {
      await api.monitors.togglePause(monitorId);
      fetchDetail();
    } catch (err) {
      alert(`Error toggling pause: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.monitors.delete(monitorId);
      setIsDeleteOpen(false);
      onBack();
    } catch (err) {
      alert(`Error deleting monitor: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-xs">
        <Activity className="w-6 h-6 mx-auto mb-2 text-zinc-400 animate-pulse" />
        Loading telemetry and performance metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <div className="text-red-400 mb-2 text-xs">Error loading monitor: {error}</div>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md text-xs hover:text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { monitor, metrics, activeIncident } = data;
  const m24h = metrics?.metrics24h;
  const m7d = metrics?.metrics7d;

  return (
    <div className="space-y-5">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">{monitor.name}</h1>
              <StatusBadge status={monitor.status} size="sm" />
              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-750">
                {monitor.method}
              </span>
            </div>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-1 mt-0.5"
            >
              {monitor.url}
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            Instant Probe
          </button>

          <button
            onClick={handleTogglePause}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 flex items-center gap-1.5"
          >
            {monitor.isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current text-emerald-400" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-zinc-400" /> Pause
              </>
            )}
          </button>

          <button
            onClick={() => setIsEditOpen(true)}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-750"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-750"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Incident Alert Banner */}
      {activeIncident && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-red-900/40 border border-red-700/50 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Active Outage Incident</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 border border-red-800 text-red-300">
                  {activeIncident.status}
                </span>
              </div>
              <p className="text-xs text-zinc-200 mt-0.5">
                {activeIncident.triggerReason}
              </p>
            </div>
          </div>

          <button
            onClick={() => onViewIncident(activeIncident._id)}
            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium whitespace-nowrap shadow-sm"
          >
            War Room &rarr;
          </button>
        </div>
      )}

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="24-Hour Uptime"
          value={m24h?.uptimePercentage !== null && m24h?.uptimePercentage !== undefined ? `${m24h.uptimePercentage}%` : null}
          subtext={m24h?.totalChecks ? `${m24h.successfulChecks} / ${m24h.totalChecks} checks` : 'Insufficient data'}
          icon={CheckCircle2}
          tone={m24h?.uptimePercentage >= 99 ? 'success' : 'warning'}
        />
        <MetricCard
          title="7-Day Uptime"
          value={m7d?.uptimePercentage !== null && m7d?.uptimePercentage !== undefined ? `${m7d.uptimePercentage}%` : null}
          subtext={m7d?.totalChecks ? `${m7d.successfulChecks} / ${m7d.totalChecks} checks` : 'Insufficient data'}
          icon={Activity}
          tone={m7d?.uptimePercentage >= 99 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Avg Latency (24h)"
          value={m24h?.avgLatencyMs !== null && m24h?.avgLatencyMs !== undefined ? `${m24h.avgLatencyMs} ms` : null}
          subtext="Arithmetic mean"
          icon={Clock}
          tone="default"
        />
        <MetricCard
          title="p95 Latency"
          value={m24h?.p95LatencyMs !== null && m24h?.p95LatencyMs !== undefined ? `${m24h.p95LatencyMs} ms` : null}
          subtext="Nearest-rank 95th percentile"
          icon={Zap}
          tone="default"
        />
      </div>

      {/* Latency History Chart */}
      <LatencyChart data={metrics?.chartData || []} height={260} />

      {/* Ping Telemetry Table */}
      <div className="bg-[#12141a] border border-zinc-800/80 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">Historical Ping Probes</h3>
            <p className="text-[11px] text-zinc-500">
              UTC logs with response latency and failure classification.
            </p>
          </div>
          <button
            onClick={() => fetchLogs(page)}
            className="p-1 rounded bg-[#0b0d12] border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin text-zinc-300' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0d12] text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="py-2 px-3">Result</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Latency</th>
                <th className="py-2 px-3">Category / Details</th>
                <th className="py-2 px-3">UTC Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-zinc-500 font-sans">
                    No ping logs persisted yet. Probes run automatically every {monitor.intervalSeconds}s.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-zinc-800/30">
                    <td className="py-2 px-3">
                      {log.success ? (
                        <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="text-red-400 font-sans font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-semibold text-zinc-200">
                      {log.statusCode ? `HTTP ${log.statusCode}` : 'ERR'}
                    </td>
                    <td className="py-2 px-3 text-zinc-200">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-2 px-3 text-zinc-400 font-sans max-w-xs truncate">
                      {log.errorCategory !== 'NONE' ? (
                        <span className="text-red-400 font-mono text-[10px] bg-red-950/50 px-1 py-0.5 rounded border border-red-800/40">
                          {log.errorCategory}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                      {log.errorMessage && (
                        <span className="text-zinc-500 block text-[10px] truncate mt-0.5">
                          {log.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-zinc-500">
                      {new Date(log.timestamp || log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800 text-[11px] text-zinc-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="p-1 rounded bg-[#0b0d12] border border-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="p-1 rounded bg-[#0b0d12] border border-zinc-800 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <MonitorModal
        isOpen={isEditOpen}
        monitor={monitor}
        onClose={() => setIsEditOpen(false)}
        onSaved={fetchDetail}
      />

      <InstantProbeModal
        isOpen={isInstantProbeOpen}
        initialUrl={monitor.url}
        onClose={() => setIsInstantProbeOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Monitor"
        message={`Delete "${monitor.name}"? All persisted ping logs and telemetry will be removed.`}
        loading={deleteLoading}
      />
    </div>
  );
}
