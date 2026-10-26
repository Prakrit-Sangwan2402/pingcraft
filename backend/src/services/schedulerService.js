/**
 * PingCraft Resilient Background Scheduler
 *
 * Runs periodic polling intervals to discover and probe active monitors:
 * - In-flight guard: Prevents overlapping probes for the same monitor.
 * - Paused/Inactive filter: Ignores paused and deleted monitors.
 * - Isolation: Individual probe timeouts/errors do not crash or block the loop.
 * - Graceful shutdown support: Cleanly aborts timers on SIGINT/SIGTERM.
 */

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
    this.pollIntervalMs = 5000; // Check DB every 5s for monitors due for a probe
  }

  /**
   * Starts the background scheduler loop.
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting PingCraft background monitoring scheduler', {
      pollIntervalMs: this.pollIntervalMs
    });

    // Run first tick immediately
    this.tick().catch(err => logger.error('Scheduler initial tick error', { error: err.message }));

    this.intervalId = setInterval(() => {
      this.tick().catch(err => logger.error('Scheduler tick error', { error: err.message }));
    }, this.pollIntervalMs);
  }

  /**
   * Evaluates which monitors are due for probing and dispatches probes.
   */
  async tick() {
    if (!this.isRunning) return;

    try {
      const now = new Date();

      // Find monitors that:
      // 1. Are active and not paused
      // 2. Either have never been checked, OR (now - lastCheckedAt) >= intervalSeconds * 1000
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

      // Dispatch probes concurrently with non-blocking Promise.allSettled
      await Promise.allSettled(monitorsToProbe.map(m => this.probeSingleMonitor(m)));
    } catch (err) {
      logger.error('Error during scheduler check cycle', { error: err.message });
    }
  }

  /**
   * Executes a probe for a single monitor with concurrency guard & error isolation.
   *
   * @param {Object} monitorData - Monitor plain object
   */
  async probeSingleMonitor(monitorData) {
    const monitorIdStr = monitorData._id.toString();
    this.inFlightMonitors.add(monitorIdStr);

    try {
      // 1. Run synthetic probe
      const probeResult = await executeProbe({
        url: monitorData.url,
        method: monitorData.method,
        headers: monitorData.headers,
        body: monitorData.body,
        expectedStatusCode: monitorData.expectedStatusCode,
        timeoutMs: monitorData.timeoutMs
      });

      const checkedAt = new Date();

      // 2. Persist PingLog record
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

      // 3. Reload monitor doc for atomic state update & incident logic
      const monitorDoc = await Monitor.findById(monitorData._id);
      if (!monitorDoc || !monitorDoc.isActive || monitorDoc.isPaused) {
        return;
      }

      monitorDoc.lastCheckedAt = checkedAt;
      monitorDoc.lastStatusCode = probeResult.statusCode;
      monitorDoc.lastLatencyMs = probeResult.latencyMs;
      monitorDoc.lastError = probeResult.errorMessage;

      // 4. Drive Incident state machine
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

  /**
   * Graceful stop of the scheduler.
   */
  async stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Scheduler stopped. Waiting for active probes to conclude...', {
      remainingInFlight: this.inFlightMonitors.size
    });

    // Wait up to 5 seconds for in-flight probes to drain
    const drainTimeout = Date.now() + 5000;
    while (this.inFlightMonitors.size > 0 && Date.now() < drainTimeout) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    logger.info('Scheduler cleanup complete.');
  }
}

// Export singleton instance
const schedulerInstance = new SchedulerService();
module.exports = schedulerInstance;
