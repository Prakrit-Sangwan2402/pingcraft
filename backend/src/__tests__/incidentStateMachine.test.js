const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const {
  processProbeIncidentLogic,
  transitionIncidentStatus
} = require('../services/incidentService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Monitor.deleteMany({});
  await Incident.deleteMany({});
});

describe('Incident State Machine & Recovery Tests', () => {
  const dummyUserId = new mongoose.Types.ObjectId();

  test('transitions monitor to DEGRADED on first failure if threshold is 2', async () => {
    const monitor = await Monitor.create({
      userId: dummyUserId,
      name: 'Auth Service',
      url: 'https://api.example.com/health',
      failureThreshold: 2,
      recoveryThreshold: 2
    });

    const failedProbe = {
      success: false,
      statusCode: 500,
      latencyMs: 150,
      errorCategory: 'HTTP_ERROR',
      errorMessage: 'HTTP 500 Internal Server Error'
    };

    await processProbeIncidentLogic(monitor, failedProbe);
    expect(monitor.consecutiveFailures).toBe(1);
    expect(monitor.status).toBe('DEGRADED');

    // No incident created yet because threshold is 2
    const incidents = await Incident.find({ monitorId: monitor._id });
    expect(incidents.length).toBe(0);
  });

  test('triggers incident and sets DOWN when failure threshold is reached', async () => {
    const monitor = await Monitor.create({
      userId: dummyUserId,
      name: 'Payment Service',
      url: 'https://pay.example.com/health',
      failureThreshold: 2,
      recoveryThreshold: 2,
      consecutiveFailures: 1,
      firstObservedFailureAt: new Date(Date.now() - 60000),
      status: 'DEGRADED'
    });

    const secondFailure = {
      success: false,
      statusCode: 503,
      latencyMs: 200,
      errorCategory: 'HTTP_ERROR',
      errorMessage: 'Service Unavailable'
    };

    const result = await processProbeIncidentLogic(monitor, secondFailure);
    expect(monitor.consecutiveFailures).toBe(2);
    expect(monitor.status).toBe('DOWN');
    expect(result.incidentCreated).toBeDefined();
    expect(result.incidentCreated.status).toBe('TRIGGERED');

    // Verify incident in DB
    const stored = await Incident.findOne({ monitorId: monitor._id });
    expect(stored).not.toBeNull();
    expect(stored.status).toBe('TRIGGERED');
    expect(stored.timeline.length).toBe(1);
  });

  test('prevents duplicate active incidents on consecutive ongoing failures', async () => {
    const monitor = await Monitor.create({
      userId: dummyUserId,
      name: 'Billing API',
      url: 'https://billing.example.com/health',
      failureThreshold: 1,
      recoveryThreshold: 2,
      consecutiveFailures: 1,
      status: 'DOWN'
    });

    // Create existing open incident
    await Incident.create({
      monitorId: monitor._id,
      userId: dummyUserId,
      status: 'TRIGGERED',
      startedAt: new Date(),
      triggerReason: 'Initial crash'
    });

    const thirdFailure = {
      success: false,
      statusCode: null,
      latencyMs: 0,
      errorCategory: 'TIMEOUT',
      errorMessage: 'Connection timed out'
    };

    await processProbeIncidentLogic(monitor, thirdFailure);
    expect(monitor.consecutiveFailures).toBe(2);

    // Ensure still exactly ONE incident exists in database
    const totalIncidents = await Incident.countDocuments({ monitorId: monitor._id });
    expect(totalIncidents).toBe(1);
  });

  test('auto-resolves incident when recovery threshold is met and restores OPERATIONAL', async () => {
    const monitor = await Monitor.create({
      userId: dummyUserId,
      name: 'Search API',
      url: 'https://search.example.com/health',
      failureThreshold: 2,
      recoveryThreshold: 2,
      consecutiveFailures: 2,
      consecutiveSuccesses: 1,
      status: 'DOWN'
    });

    const openIncident = await Incident.create({
      monitorId: monitor._id,
      userId: dummyUserId,
      status: 'TRIGGERED',
      startedAt: new Date(Date.now() - 30000), // 30s ago
      triggerReason: 'Outage detected'
    });

    const secondSuccess = {
      success: true,
      statusCode: 200,
      latencyMs: 45,
      errorCategory: 'NONE',
      errorMessage: null
    };

    const result = await processProbeIncidentLogic(monitor, secondSuccess);
    expect(monitor.consecutiveSuccesses).toBe(2);
    expect(monitor.consecutiveFailures).toBe(0);
    expect(monitor.status).toBe('OPERATIONAL');

    expect(result.incidentResolved).toBeDefined();

    const resolvedIncident = await Incident.findById(openIncident._id);
    expect(resolvedIncident.status).toBe('RESOLVED');
    expect(resolvedIncident.resolvedAt).not.toBeNull();
    expect(resolvedIncident.durationSeconds).toBeGreaterThanOrEqual(30);
    expect(resolvedIncident.timeline.length).toBe(1); // Auto-resolve event added
  });

  test('validates manual incident workflow transitions', async () => {
    const monitor = await Monitor.create({
      userId: dummyUserId,
      name: 'User Service',
      url: 'https://user.example.com/health'
    });

    const incident = await Incident.create({
      monitorId: monitor._id,
      userId: dummyUserId,
      status: 'TRIGGERED',
      startedAt: new Date(),
      triggerReason: 'Gateway Timeout'
    });

    // 1. TRIGGERED -> INVESTIGATING
    const step1 = await transitionIncidentStatus(
      incident._id,
      dummyUserId,
      'INVESTIGATING',
      'Engineer paged, inspecting server metrics.'
    );
    expect(step1.status).toBe('INVESTIGATING');
    expect(step1.acknowledgedAt).not.toBeNull();

    // 2. INVESTIGATING -> MITIGATING
    const step2 = await transitionIncidentStatus(
      incident._id,
      dummyUserId,
      'MITIGATING',
      'Restarting container pods.'
    );
    expect(step2.status).toBe('MITIGATING');

    // 3. MITIGATING -> RESOLVED
    const step3 = await transitionIncidentStatus(
      incident._id,
      dummyUserId,
      'RESOLVED',
      'All pods healthy, latency restored.'
    );
    expect(step3.status).toBe('RESOLVED');
    expect(step3.resolvedAt).not.toBeNull();

    // 4. Cannot re-transition from RESOLVED
    await expect(
      transitionIncidentStatus(incident._id, dummyUserId, 'INVESTIGATING', 'Reopen')
    ).rejects.toThrow('Cannot transition an incident that is already RESOLVED');
  });
});
