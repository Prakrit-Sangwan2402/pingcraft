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
      <div className="py-24 text-center text-slate-500 text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 text-indigo-500 animate-pulse" />
        Loading monitor telemetry and metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <div className="text-rose-400 mb-2">Error loading monitor: {error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs"
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
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">{monitor.name}</h1>
              <StatusBadge status={monitor.status} />
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {monitor.method}
              </span>
            </div>
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
            >
              {monitor.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInstantProbeOpen(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Instant Probe
          </button>

          <button
            onClick={handleTogglePause}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            {monitor.isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" /> Pause
              </>
            )}
          </button>

          <button
            onClick={() => setIsEditOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 border border-slate-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Incident Banner */}
      {activeIncident && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Active Outage Incident</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  {activeIncident.status}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-medium">
                {activeIncident.triggerReason}
              </p>
              <span className="text-[11px] text-slate-400">
                Started: {new Date(activeIncident.startedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => onViewIncident(activeIncident._id)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shadow-md shadow-rose-950"
          >
            Open Incident War Room
          </button>
        </div>
      )}

      {/* SLA & Telemetry KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          title="24-Hour Uptime"
          value={m24h?.uptimePercentage !== null && m24h?.uptimePercentage !== undefined ? `${m24h.uptimePercentage}%` : null}
          subtext={m24h?.totalChecks ? `${m24h.successfulChecks} / ${m24h.totalChecks} checks passed` : 'Insufficient observations'}
          icon={CheckCircle2}
          tone={m24h?.uptimePercentage >= 99 ? 'success' : 'warning'}
        />
        <MetricCard
          title="7-Day Uptime"
          value={m7d?.uptimePercentage !== null && m7d?.uptimePercentage !== undefined ? `${m7d.uptimePercentage}%` : null}
          subtext={m7d?.totalChecks ? `${m7d.successfulChecks} / ${m7d.totalChecks} checks recorded` : 'Insufficient observations'}
          icon={Activity}
          tone={m7d?.uptimePercentage >= 99 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Avg Latency (24h)"
          value={m24h?.avgLatencyMs !== null && m24h?.avgLatencyMs !== undefined ? `${m24h.avgLatencyMs} ms` : null}
          subtext="Mean response duration"
          icon={Clock}
          tone="default"
        />
        <MetricCard
          title="p95 Latency"
          value={m24h?.p95LatencyMs !== null && m24h?.p95LatencyMs !== undefined ? `${m24h.p95LatencyMs} ms` : null}
          subtext="95th percentile response ceiling"
          icon={Zap}
          tone="brand"
        />
      </div>

      {/* Latency History Chart */}
      <LatencyChart data={metrics?.chartData || []} height={280} />

      {/* Historical Telemetry Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Persisted Ping Telemetry Logs</h3>
            <p className="text-xs text-slate-400">
              UTC timestamps, exact response durations, and failure classification.
            </p>
          </div>
          <button
            onClick={() => fetchLogs(page)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Status Code</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Error / Category</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-sans">
                    No ping logs recorded yet for this monitor.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> Fail
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {log.statusCode ? `HTTP ${log.statusCode}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-medium">
                      {log.latencyMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate font-sans">
                      {log.errorCategory !== 'NONE' ? (
                        <span className="text-rose-400 font-mono text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {log.errorCategory}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      {log.errorMessage && (
                        <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                          {log.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(log.timestamp || log.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => fetchLogs(page - 1)}
                className="p-1 rounded bg-slate-950 border border-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchLogs(page + 1)}
                className="p-1 rounded bg-slate-950 border border-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
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
        message={`Are you sure you want to delete "${monitor.name}"? All historical telemetry and incidents will be deleted.`}
        loading={deleteLoading}
      />
    </div>
  );
}
