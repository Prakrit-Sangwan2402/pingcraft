const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');
const logger = require('../utils/logger');

const VALID_TRANSITIONS = {
  TRIGGERED: ['INVESTIGATING', 'RESOLVED'],
  INVESTIGATING: ['MITIGATING', 'RESOLVED'],
  MITIGATING: ['RESOLVED'],
  RESOLVED: []
};

async function processProbeIncidentLogic(monitor, probeResult) {
  const now = new Date();

  if (probeResult.success) {
    monitor.consecutiveSuccesses += 1;
    monitor.consecutiveFailures = 0;
    monitor.firstObservedFailureAt = null;

    if (monitor.consecutiveSuccesses >= monitor.recoveryThreshold) {
      const openIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: { $ne: 'RESOLVED' }
      });

      if (openIncident) {
        const resolvedAt = now;
        const durationSeconds = Math.max(0, Math.round((resolvedAt.getTime() - openIncident.startedAt.getTime()) / 1000));
        const resolutionReason = `Auto-recovered: Endpoint returned status ${probeResult.statusCode} for ${monitor.recoveryThreshold} consecutive checks.`;

        openIncident.status = 'RESOLVED';
        openIncident.resolvedAt = resolvedAt;
        openIncident.durationSeconds = durationSeconds;
        openIncident.resolutionReason = resolutionReason;
        openIncident.timeline.push({
          status: 'RESOLVED',
          message: resolutionReason,
          actor: 'SYSTEM',
          timestamp: resolvedAt
        });

        await openIncident.save();
        monitor.status = 'OPERATIONAL';

        logger.info('Incident auto-resolved', {
          monitorId: monitor._id.toString(),
          incidentId: openIncident._id.toString(),
          durationSeconds
        });

        return { monitorUpdated: true, incidentResolved: openIncident };
      } else if (monitor.status !== 'OPERATIONAL' && !monitor.isPaused) {
        monitor.status = 'OPERATIONAL';
        return { monitorUpdated: true };
      }
    }
    return { monitorUpdated: true };
  }

  monitor.consecutiveFailures += 1;
  monitor.consecutiveSuccesses = 0;

  if (!monitor.firstObservedFailureAt) {
    monitor.firstObservedFailureAt = now;
  }

  if (monitor.consecutiveFailures >= monitor.failureThreshold) {
    const existingIncident = await Incident.findOne({
      monitorId: monitor._id,
      status: { $ne: 'RESOLVED' }
    });

    if (!existingIncident) {
      const triggerReason = probeResult.errorMessage || `Probe failed: ${probeResult.errorCategory}`;
      const startedAt = monitor.firstObservedFailureAt || now;

      const newIncident = new Incident({
        monitorId: monitor._id,
        userId: monitor.userId,
        status: 'TRIGGERED',
        startedAt,
        detectedAt: now,
        triggerReason,
        timeline: [
          {
            status: 'TRIGGERED',
            message: `Triggered after ${monitor.consecutiveFailures} consecutive failures: ${triggerReason}`,
            actor: 'SYSTEM',
            timestamp: now
          }
        ]
      });

      await newIncident.save();
      monitor.status = 'DOWN';

      logger.warn('Incident triggered', {
        monitorId: monitor._id.toString(),
        incidentId: newIncident._id.toString(),
        triggerReason
      });

      return { monitorUpdated: true, incidentCreated: newIncident };
    }

    if (monitor.status !== 'DOWN') {
      monitor.status = 'DOWN';
      return { monitorUpdated: true };
    }
  } else if (monitor.consecutiveFailures > 0 && monitor.status === 'OPERATIONAL') {
    monitor.status = 'DEGRADED';
    return { monitorUpdated: true };
  }

  return { monitorUpdated: true };
}

async function transitionIncidentStatus(incidentId, userId, nextStatus, message) {
  const incident = await Incident.findOne({ _id: incidentId, userId });
  if (!incident) {
    const error = new Error('Incident not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = incident.status;
  if (currentStatus === 'RESOLVED') {
    const error = new Error('Cannot transition an incident that is already RESOLVED');
    error.statusCode = 400;
    throw error;
  }

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Invalid transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  incident.status = nextStatus;

  if (nextStatus === 'INVESTIGATING' && !incident.acknowledgedAt) {
    incident.acknowledgedAt = now;
  }

  if (nextStatus === 'RESOLVED') {
    incident.resolvedAt = now;
    incident.durationSeconds = Math.max(0, Math.round((now.getTime() - incident.startedAt.getTime()) / 1000));
    incident.resolutionReason = message || 'Marked as resolved by user.';

    await Monitor.findByIdAndUpdate(incident.monitorId, {
      status: 'OPERATIONAL',
      consecutiveFailures: 0
    });
  }

  incident.timeline.push({
    status: nextStatus,
    message: message || `Status changed to ${nextStatus}`,
    actor: 'USER',
    timestamp: now
  });

  await incident.save();
  return incident;
}

module.exports = {
  processProbeIncidentLogic,
  transitionIncidentStatus,
  VALID_TRANSITIONS
};
