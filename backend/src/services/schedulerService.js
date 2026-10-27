const Monitor = require('../models/Monitor');
const PingLog = require('../models/PingLog');
const { executeProbe } = require('./probeEngine');
const { processProbeIncidentLogic } = require('./incidentService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.inFlightMonitors = new Set();
    this.pollIntervalMs = 5000;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    logger.info('Background scheduler started', { pollIntervalMs: this.pollIntervalMs });

    this.tick().catch(err => logger.error('Scheduler initial tick error', { error: err.message }));

    this.intervalId = setInterval(() => {
      this.tick().catch(err => logger.error('Scheduler tick error', { error: err.message }));
    }, this.pollIntervalMs);
  }

  async tick() {
    if (!this.isRunning) return;

    try {
      const now = new Date();

      const activeMonitors = await Monitor.find({
        isActive: true,
        isPaused: false
      }).lean();

      const monitorsToProbe = activeMonitors.filter(m => {
        if (this.inFlightMonitors.has(m._id.toString())) return false;
        if (!m.lastCheckedAt) return true;
        const elapsedMs = now.getTime() - new Date(m.lastCheckedAt).getTime();
        return elapsedMs >= (m.intervalSeconds * 1000);
      });

      if (monitorsToProbe.length === 0) return;

      await Promise.allSettled(monitorsToProbe.map(m => this.probeSingleMonitor(m)));
    } catch (err) {
      logger.error('Error during scheduler check cycle', { error: err.message });
    }
  }

  async probeSingleMonitor(monitorData) {
    const monitorIdStr = monitorData._id.toString();
    this.inFlightMonitors.add(monitorIdStr);

    try {
      const probeResult = await executeProbe({
        url: monitorData.url,
        method: monitorData.method,
        headers: monitorData.headers,
        body: monitorData.body,
        expectedStatusCode: monitorData.expectedStatusCode,
        timeoutMs: monitorData.timeoutMs
      });

      const checkedAt = new Date();

      const pingLog = new PingLog({
        monitorId: monitorData._id,
        userId: monitorData.userId,
        timestamp: checkedAt,
        statusCode: probeResult.statusCode,
        latencyMs: probeResult.latencyMs,
        success: probeResult.success,
        errorCategory: probeResult.errorCategory,
        errorMessage: probeResult.errorMessage,
        responseSize: probeResult.responseSize
      });
      await pingLog.save();

      const monitorDoc = await Monitor.findById(monitorData._id);
      if (!monitorDoc || !monitorDoc.isActive || monitorDoc.isPaused) {
        return;
      }

      monitorDoc.lastCheckedAt = checkedAt;
      monitorDoc.lastStatusCode = probeResult.statusCode;
      monitorDoc.lastLatencyMs = probeResult.latencyMs;
      monitorDoc.lastError = probeResult.errorMessage;

      await processProbeIncidentLogic(monitorDoc, probeResult);
      await monitorDoc.save();
    } catch (err) {
      logger.error('Failed to probe monitor', {
        monitorId: monitorIdStr,
        error: err.message
      });
    } finally {
      this.inFlightMonitors.delete(monitorIdStr);
    }
  }

  async stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const drainTimeout = Date.now() + 5000;
    while (this.inFlightMonitors.size > 0 && Date.now() < drainTimeout) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

const schedulerInstance = new SchedulerService();
module.exports = schedulerInstance;
