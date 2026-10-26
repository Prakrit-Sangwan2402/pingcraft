/**
 * PingCraft Incident State Machine & Service
 *
 * Enforces valid state transitions:
 * TRIGGERED -> INVESTIGATING -> MITIGATING -> RESOLVED
 *
 * Guarantees:
 * - At most one active (unresolved) incident per monitor
 * - Atomic state transitions
 * - Auto-recovery when recovery threshold is achieved
 * - Immutable append-only audit timeline
 */

const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');
const logger = require('../utils/logger');

const VALID_TRANSITIONS = {
  TRIGGERED: ['INVESTIGATING', 'RESOLVED'],
  INVESTIGATING: ['MITIGATING', 'RESOLVED'],
  MITIGATING: ['RESOLVED'],
  RESOLVED: [] // Terminal state
};

/**
 * Handles probe result feedback for a monitor and drives incident creation / resolution.
 *
 * @param {Object} monitor - Mongoose Monitor document
 * @param {Object} probeResult - Output from executeProbe()
 * @returns {Promise<{ monitorUpdated: boolean, incidentCreated?: Object, incidentResolved?: Object }>}
 */
async function processProbeIncidentLogic(monitor, probeResult) {
  const now = new Date();

  if (probeResult.success) {
    // Increment consecutive successes, reset consecutive failures
    monitor.consecutiveSuccesses += 1;
    monitor.consecutiveFailures = 0;
    monitor.firstObservedFailureAt = null;

    // Check if recovery threshold achieved
    if (monitor.consecutiveSuccesses >= monitor.recoveryThreshold) {
      // Find unresolved incident if any
      const openIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: { $ne: 'RESOLVED' }
      });

      if (openIncident) {
        const resolvedAt = now;
        const durationSeconds = Math.max(0, Math.round((resolvedAt.getTime() - openIncident.startedAt.getTime()) / 1000));
        const resolutionReason = `Auto-recovered: Endpoint returned expected status (${probeResult.statusCode}) for ${monitor.recoveryThreshold} consecutive checks.`;

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

        logger.info('Incident auto-resolved for monitor', {
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
  } else {
    // Failure observed
    monitor.consecutiveFailures += 1;
    monitor.consecutiveSuccesses = 0;

    if (!monitor.firstObservedFailureAt) {
      monitor.firstObservedFailureAt = now;
    }

    // Check if failure threshold reached
    if (monitor.consecutiveFailures >= monitor.failureThreshold) {
      // Atomically check if an active incident already exists to prevent duplicate creation
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
              message: `Incident triggered after ${monitor.consecutiveFailures} consecutive failures: ${triggerReason}`,
              actor: 'SYSTEM',
              timestamp: now
            }
          ]
        });

        await newIncident.save();
        monitor.status = 'DOWN';

        logger.warn('New incident triggered for monitor', {
          monitorId: monitor._id.toString(),
          incidentId: newIncident._id.toString(),
          triggerReason
        });

        return { monitorUpdated: true, incidentCreated: newIncident };
      } else {
        // Incident already open; ensure monitor status reflects DOWN/DEGRADED
        if (monitor.status !== 'DOWN') {
          monitor.status = 'DOWN';
          return { monitorUpdated: true };
        }
      }
    } else if (monitor.consecutiveFailures > 0 && monitor.status === 'OPERATIONAL') {
      // Mark as DEGRADED when first failure is detected before hitting full incident threshold
      monitor.status = 'DEGRADED';
      return { monitorUpdated: true };
    }

    return { monitorUpdated: true };
  }
}

/**
 * Validates and executes a manual incident status transition.
 *
 * @param {string} incidentId
 * @param {string} userId - Requesting user (for ownership verification)
 * @param {string} nextStatus - 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED'
 * @param {string} message - Note explaining transition
 * @returns {Promise<Object>} Updated Incident
 */
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
    const error = new Error(`Invalid state transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`);
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
    incident.resolutionReason = message || 'Manually marked as resolved by responder.';

    // Also update monitor status back to operational
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
