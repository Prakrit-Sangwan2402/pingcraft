const Monitor = require('../models/Monitor');
const PingLog = require('../models/PingLog');
const Incident = require('../models/Incident');
const { validateTargetUrl } = require('../utils/ssrfValidator');
const { executeProbe } = require('../services/probeEngine');
const { getMonitorSummaryMetrics, getMonitorWindowMetrics } = require('../services/metricsService');
const { processProbeIncidentLogic } = require('../services/incidentService');
const logger = require('../utils/logger');

async function createMonitor(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      name,
      url,
      method = 'GET',
      headers = {},
      body = null,
      expectedStatusCode = 200,
      timeoutMs = 10000,
      intervalSeconds = 60,
      failureThreshold = 2,
      recoveryThreshold = 2,
      isPublic = false
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Monitor name and target URL are required.'
      });
    }

    const activeCount = await Monitor.countDocuments({ userId, isActive: true });
    if (activeCount >= req.user.maxMonitors) {
      return res.status(403).json({
        success: false,
        message: `Limit reached: You have reached your quota of ${req.user.maxMonitors} active monitors.`
      });
    }

    const ssrfCheck = await validateTargetUrl(url);
    if (!ssrfCheck.valid) {
      return res.status(400).json({
        success: false,
        message: `Target URL rejected: ${ssrfCheck.error}`
      });
    }

    const existing = await Monitor.findOne({
      userId,
      url: url.trim(),
      method: method.toUpperCase(),
      isActive: true
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An active monitor with this exact URL and HTTP method already exists in your account.'
      });
    }

    const monitor = new Monitor({
      userId,
      name: name.trim(),
      url: url.trim(),
      method: method.toUpperCase(),
      headers,
      body,
      expectedStatusCode: Number(expectedStatusCode) || 200,
      timeoutMs: Math.max(1000, Math.min(30000, Number(timeoutMs) || 10000)),
      intervalSeconds: Math.max(10, Math.min(3600, Number(intervalSeconds) || 60)),
      failureThreshold: Math.max(1, Math.min(10, Number(failureThreshold) || 2)),
      recoveryThreshold: Math.max(1, Math.min(10, Number(recoveryThreshold) || 2)),
      isPublic: Boolean(isPublic)
    });

    await monitor.save();

    executeProbe({
      url: monitor.url,
      method: monitor.method,
      headers: monitor.headers,
      body: monitor.body,
      expectedStatusCode: monitor.expectedStatusCode,
      timeoutMs: monitor.timeoutMs
    }).then(async probeResult => {
      const currentMonitor = await Monitor.findById(monitor._id);
      if (!currentMonitor || !currentMonitor.isActive) return;

      const now = new Date();
      await PingLog.create({
        monitorId: currentMonitor._id,
        userId: currentMonitor.userId,
        timestamp: now,
        statusCode: probeResult.statusCode,
        latencyMs: probeResult.latencyMs,
        success: probeResult.success,
        errorCategory: probeResult.errorCategory,
        errorMessage: probeResult.errorMessage,
        responseSize: probeResult.responseSize
      });

      currentMonitor.lastCheckedAt = now;
      currentMonitor.lastStatusCode = probeResult.statusCode;
      currentMonitor.lastLatencyMs = probeResult.latencyMs;
      currentMonitor.lastError = probeResult.errorMessage;
      await processProbeIncidentLogic(currentMonitor, probeResult);
      await currentMonitor.save();
    }).catch(err => {
      logger.error('Initial probe failed', { error: err.message, monitorId: monitor._id });
    });

    res.status(201).json({
      success: true,
      message: 'Monitor created successfully.',
      data: monitor
    });
  } catch (err) {
    next(err);
  }
}

async function getMonitors(req, res, next) {
  try {
    const userId = req.user._id;
    const { status, search, sort = '-createdAt' } = req.query;

    const query = { userId, isActive: true };

    if (status && ['OPERATIONAL', 'DEGRADED', 'DOWN', 'PAUSED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { url: searchRegex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    else if (sort === '-name') sortOption = { name: -1 };
    else if (sort === 'status') sortOption = { status: 1 };
    else if (sort === 'lastCheckedAt') sortOption = { lastCheckedAt: -1 };
    else if (sort === 'lastLatencyMs') sortOption = { lastLatencyMs: 1 };

    const monitors = await Monitor.find(query).sort(sortOption).lean();

    const enriched = await Promise.all(
      monitors.map(async m => {
        const metrics = await getMonitorWindowMetrics(m._id, 24);
        return {
          ...m,
          uptime24h: metrics.uptimePercentage,
          avgLatency24h: metrics.avgLatencyMs
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
}

async function getMonitorById(req, res, next) {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user._id, isActive: true });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found or unauthorized.'
      });
    }

    const metrics = await getMonitorSummaryMetrics(monitor._id, 50);

    const activeIncident = await Incident.findOne({
      monitorId: monitor._id,
      status: { $ne: 'RESOLVED' }
    });

    res.status(200).json({
      success: true,
      data: {
        monitor,
        metrics,
        activeIncident
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateMonitor(req, res, next) {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user._id, isActive: true });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found or unauthorized.'
      });
    }

    const {
      name,
      url,
      method,
      headers,
      body,
      expectedStatusCode,
      timeoutMs,
      intervalSeconds,
      failureThreshold,
      recoveryThreshold,
      isPublic
    } = req.body;

    if (url && url !== monitor.url) {
      const ssrfCheck = await validateTargetUrl(url);
      if (!ssrfCheck.valid) {
        return res.status(400).json({
          success: false,
          message: `Target URL rejected: ${ssrfCheck.error}`
        });
      }
      monitor.url = url.trim();
    }

    if (name) monitor.name = name.trim();
    if (method) monitor.method = method.toUpperCase();
    if (headers !== undefined) monitor.headers = headers;
    if (body !== undefined) monitor.body = body;
    if (expectedStatusCode !== undefined) monitor.expectedStatusCode = Number(expectedStatusCode);
    if (timeoutMs !== undefined) monitor.timeoutMs = Math.max(1000, Math.min(30000, Number(timeoutMs)));
    if (intervalSeconds !== undefined) monitor.intervalSeconds = Math.max(10, Math.min(3600, Number(intervalSeconds)));
    if (failureThreshold !== undefined) monitor.failureThreshold = Math.max(1, Math.min(10, Number(failureThreshold)));
    if (recoveryThreshold !== undefined) monitor.recoveryThreshold = Math.max(1, Math.min(10, Number(recoveryThreshold)));
    if (isPublic !== undefined) monitor.isPublic = Boolean(isPublic);

    await monitor.save();

    res.status(200).json({
      success: true,
      message: 'Monitor updated successfully.',
      data: monitor
    });
  } catch (err) {
    next(err);
  }
}

async function togglePauseMonitor(req, res, next) {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user._id, isActive: true });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found or unauthorized.'
      });
    }

    monitor.isPaused = !monitor.isPaused;
    if (monitor.isPaused) {
      monitor.status = 'PAUSED';
    } else {
      monitor.status = 'OPERATIONAL';
      monitor.consecutiveFailures = 0;
      monitor.consecutiveSuccesses = 0;
    }

    await monitor.save();

    res.status(200).json({
      success: true,
      message: monitor.isPaused ? 'Monitor paused.' : 'Monitor resumed.',
      data: monitor
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMonitor(req, res, next) {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user._id });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found or unauthorized.'
      });
    }

    monitor.isActive = false;
    await monitor.save();

    Promise.all([
      PingLog.deleteMany({ monitorId: id }),
      Incident.deleteMany({ monitorId: id })
    ]).catch(err => logger.error('Error cleaning up deleted monitor logs', { error: err.message }));

    res.status(200).json({
      success: true,
      message: 'Monitor deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

async function instantProbe(req, res, next) {
  try {
    const { url, method = 'GET', headers = {}, body = null, expectedStatusCode = 200, timeoutMs = 10000 } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Target URL is required for probe.'
      });
    }

    const result = await executeProbe({
      url,
      method,
      headers,
      body,
      expectedStatusCode: Number(expectedStatusCode) || 200,
      timeoutMs: Math.min(30000, Number(timeoutMs) || 10000)
    });

    res.status(200).json({
      success: true,
      data: {
        targetUrl: url,
        method,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        isSuccess: result.success,
        errorCategory: result.errorCategory,
        errorMessage: result.errorMessage,
        responseSize: result.responseSize
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMonitorPingLogs(req, res, next) {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({ _id: id, userId: req.user._id });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Monitor not found or unauthorized.'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      PingLog.find({ monitorId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PingLog.countDocuments({ monitorId: id })
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function seedDemoMonitors(req, res, next) {
  try {
    const userId = req.user._id;

    const samples = [
      {
        name: 'GitHub Status API',
        url: 'https://www.githubstatus.com/api/v2/status.json',
        method: 'GET',
        expectedStatusCode: 200,
        intervalSeconds: 15,
        timeoutMs: 8000,
        failureThreshold: 2,
        recoveryThreshold: 2,
        isPublic: true
      },
      {
        name: 'Cloudflare DNS Service',
        url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A',
        method: 'GET',
        headers: { Accept: 'application/dns-json' },
        expectedStatusCode: 200,
        intervalSeconds: 30,
        timeoutMs: 8000,
        failureThreshold: 2,
        recoveryThreshold: 2,
        isPublic: true
      },
      {
        name: 'HttpBin Public Health',
        url: 'https://httpbin.org/status/200',
        method: 'GET',
        expectedStatusCode: 200,
        intervalSeconds: 30,
        timeoutMs: 8000,
        failureThreshold: 2,
        recoveryThreshold: 2,
        isPublic: true
      },
      {
        name: 'Simulated Outage Endpoint',
        url: 'https://httpbin.org/status/503',
        method: 'GET',
        expectedStatusCode: 200,
        intervalSeconds: 15,
        timeoutMs: 8000,
        failureThreshold: 2,
        recoveryThreshold: 2,
        isPublic: true
      }
    ];

    const created = [];
    for (const sample of samples) {
      const exists = await Monitor.findOne({ userId, url: sample.url, isActive: true });
      if (!exists) {
        const mon = await Monitor.create({ ...sample, userId });
        created.push(mon);
      }
    }

    res.status(201).json({
      success: true,
      message: `Seeded ${created.length} demo monitors.`,
      data: created
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMonitor,
  getMonitors,
  getMonitorById,
  updateMonitor,
  togglePauseMonitor,
  deleteMonitor,
  instantProbe,
  getMonitorPingLogs,
  seedDemoMonitors
};
