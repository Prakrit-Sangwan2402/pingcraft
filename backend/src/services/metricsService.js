const PingLog = require('../models/PingLog');

function calculateP95(latencies) {
  if (!latencies || latencies.length === 0) return null;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(0.95 * sorted.length) - 1);
  return Math.round(sorted[index] * 100) / 100;
}

function calculateAverage(latencies) {
  if (!latencies || latencies.length === 0) return null;
  const sum = latencies.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / latencies.length) * 100) / 100;
}

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
