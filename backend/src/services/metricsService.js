/**
 * PingCraft Dedicated Telemetry & Metrics Calculation Service
 *
 * Provides accurate, consistent metrics calculations across private dashboards,
 * monitor details, and public status pages.
 *
 * Definitions:
 * - Uptime % = (successfulChecks / totalRecordedChecks) * 100
 * - If totalRecordedChecks === 0 -> returns null (explicit 'No data' state, never assumes 100%)
 * - p95 Latency: Nearest-Rank Method:
 *     1. Filter valid non-negative latencies.
 *     2. Sort ascending.
 *     3. Rank index = Math.ceil(0.95 * N) - 1.
 */

const PingLog = require('../models/PingLog');

/**
 * Calculates nearest-rank 95th percentile latency from an array of numbers.
 *
 * @param {number[]} latencies
 * @returns {number|null}
 */
function calculateP95(latencies) {
  if (!latencies || latencies.length === 0) return null;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
  return Math.round(sorted[index] * 100) / 100;
}

/**
 * Calculates mean latency from an array of numbers.
 *
 * @param {number[]} latencies
 * @returns {number|null}
 */
function calculateAverage(latencies) {
  if (!latencies || latencies.length === 0) return null;
  const sum = latencies.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / latencies.length) * 100) / 100;
}

/**
 * Computes telemetry metrics for a given monitor over a time window.
 *
 * @param {string|ObjectId} monitorId
 * @param {number} windowHours - 24 for 24h, 168 for 7 days
 * @returns {Promise<{
 *   uptimePercentage: number|null,
 *   avgLatencyMs: number|null,
 *   p95LatencyMs: number|null,
 *   totalChecks: number,
 *   successfulChecks: number,
 *   failedChecks: number,
 *   windowHours: number
 * }>}
 */
async function getMonitorWindowMetrics(monitorId, windowHours = 24) {
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const logs = await PingLog.find({
    monitorId,
    createdAt: { $gte: windowStart }
  })
    .select('latencyMs success statusCode')
    .lean();

  const totalChecks = logs.length;

  if (totalChecks === 0) {
    return {
      uptimePercentage: null,
      avgLatencyMs: null,
      p95LatencyMs: null,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      windowHours
    };
  }

  const successfulChecks = logs.filter(l => l.success).length;
  const failedChecks = totalChecks - successfulChecks;
  const uptimePercentage = Math.round((successfulChecks / totalChecks) * 10000) / 100;

  // For latency metrics, collect positive latency measurements
  const validLatencies = logs
    .filter(l => typeof l.latencyMs === 'number' && l.latencyMs >= 0)
    .map(l => l.latencyMs);

  const avgLatencyMs = calculateAverage(validLatencies);
  const p95LatencyMs = calculateP95(validLatencies);

  return {
    uptimePercentage,
    avgLatencyMs,
    p95LatencyMs,
    totalChecks,
    successfulChecks,
    failedChecks,
    windowHours
  };
}

/**
 * Returns comprehensive summary metrics for a monitor (24h, 7d, and latest chart points).
 *
 * @param {string|ObjectId} monitorId
 * @param {number} [chartPointsLimit=50]
 */
async function getMonitorSummaryMetrics(monitorId, chartPointsLimit = 50) {
  const [metrics24h, metrics7d, recentLogs] = await Promise.all([
    getMonitorWindowMetrics(monitorId, 24),
    getMonitorWindowMetrics(monitorId, 168),
    PingLog.find({ monitorId })
      .sort({ createdAt: -1 })
      .limit(chartPointsLimit)
      .select('latencyMs statusCode success errorCategory timestamp createdAt')
      .lean()
  ]);

  // Reverse so chronological order (left to right) for charts
  const chartData = recentLogs.reverse().map(log => ({
    timestamp: log.createdAt || log.timestamp,
    latencyMs: log.latencyMs,
    statusCode: log.statusCode,
    success: log.success,
    errorCategory: log.errorCategory
  }));

  return {
    metrics24h,
    metrics7d,
    chartData
  };
}

module.exports = {
  getMonitorWindowMetrics,
  getMonitorSummaryMetrics,
  calculateP95,
  calculateAverage
};
