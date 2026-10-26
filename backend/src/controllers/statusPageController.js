/**
 * PingCraft Status Page Controller
 *
 * Provides:
 * - Public, unauthenticated, sanitized status page endpoint
 * - Authenticated status page management endpoints
 */

const StatusPage = require('../models/StatusPage');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const { getMonitorWindowMetrics } = require('../services/metricsService');

// GET /api/status-pages/public/:slug (PUBLIC - NO AUTH REQUIRED)
async function getPublicStatusPage(req, res, next) {
  try {
    const { slug } = req.params;

    const page = await StatusPage.findOne({
      slug: slug.toLowerCase().trim(),
      isPublished: true
    }).lean();

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Status page not found or is currently unpublished.'
      });
    }

    // Fetch public monitors associated with this status page
    const monitors = await Monitor.find({
      _id: { $in: page.monitors },
      isActive: true,
      isPublic: true
    })
      .select('name status lastCheckedAt')
      .lean();

    const monitorIds = monitors.map(m => m._id);

    // Compute metrics for each component
    let hasDown = false;
    let hasDegraded = false;
    let totalRecordedProbesAcrossAll = 0;

    const components = await Promise.all(
      monitors.map(async m => {
        const [m24h, m7d] = await Promise.all([
          getMonitorWindowMetrics(m._id, 24),
          getMonitorWindowMetrics(m._id, 168)
        ]);

        if (m.status === 'DOWN') hasDown = true;
        if (m.status === 'DEGRADED') hasDegraded = true;
        totalRecordedProbesAcrossAll += m24h.totalChecks;

        return {
          id: m._id,
          name: m.name,
          status: m.status,
          uptime24h: m24h.uptimePercentage,
          uptime7d: m7d.uptimePercentage,
          lastCheckedAt: m.lastCheckedAt
        };
      })
    );

    // Derive overall system status
    let overallStatus = 'ALL_SYSTEMS_OPERATIONAL';
    if (components.length === 0 || totalRecordedProbesAcrossAll === 0) {
      overallStatus = 'NO_DATA';
    } else if (hasDown) {
      overallStatus = 'MAJOR_OUTAGE';
    } else if (hasDegraded) {
      overallStatus = 'DEGRADED_PERFORMANCE';
    }

    // Fetch active incidents + recent resolved incidents (past 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const incidents = await Incident.find({
      monitorId: { $in: monitorIds },
      $or: [
        { status: { $ne: 'RESOLVED' } },
        { resolvedAt: { $gte: sevenDaysAgo } }
      ]
    })
      .populate('monitorId', 'name')
      .sort({ createdAt: -1 })
      .select('status startedAt detectedAt resolvedAt durationSeconds triggerReason resolutionReason timeline monitorId')
      .lean();

    const sanitizedIncidents = incidents.map(inc => ({
      id: inc._id,
      componentName: inc.monitorId ? inc.monitorId.name : 'Unknown Component',
      status: inc.status,
      startedAt: inc.startedAt,
      resolvedAt: inc.resolvedAt,
      durationSeconds: inc.durationSeconds,
      title: inc.triggerReason,
      timeline: inc.timeline.map(t => ({
        status: t.status,
        message: t.message,
        timestamp: t.timestamp
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        title: page.title,
        description: page.description,
        slug: page.slug,
        overallStatus,
        components,
        incidents: sanitizedIncidents
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/status-pages/me (AUTHENTICATED)
async function getMyStatusPage(req, res, next) {
  try {
    let page = await StatusPage.findOne({ userId: req.user._id })
      .populate('monitors', 'name url status isPublic')
      .lean();

    if (!page) {
      // Default initial config if none created yet
      const baseSlug = req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      page = await StatusPage.create({
        userId: req.user._id,
        slug: uniqueSlug,
        title: `${req.user.name}'s Service Status`,
        description: 'Real-time uptime and incident tracking.',
        monitors: [],
        isPublished: true
      });
    }

    res.status(200).json({
      success: true,
      data: page
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/status-pages/me (AUTHENTICATED)
async function updateMyStatusPage(req, res, next) {
  try {
    const { slug, title, description, monitors, isPublished } = req.body;

    let page = await StatusPage.findOne({ userId: req.user._id });

    if (slug) {
      const cleanSlug = slug.toLowerCase().trim();
      const existingSlug = await StatusPage.findOne({ slug: cleanSlug, userId: { $ne: req.user._id } });
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          message: 'That status page slug is already taken by another user.'
        });
      }
      if (!page) page = new StatusPage({ userId: req.user._id, slug: cleanSlug });
      page.slug = cleanSlug;
    }

    if (!page) {
      page = new StatusPage({ userId: req.user._id, slug: `status-${Date.now()}` });
    }

    if (title) page.title = title.trim();
    if (description !== undefined) page.description = description.trim();
    if (monitors && Array.isArray(monitors)) {
      // Ensure monitors belong to this user and mark them isPublic
      const validMonitors = await Monitor.find({ _id: { $in: monitors }, userId: req.user._id }).select('_id');
      const validIds = validMonitors.map(m => m._id);
      page.monitors = validIds;

      // Update monitor isPublic flag
      await Monitor.updateMany({ _id: { $in: validIds } }, { isPublic: true });
    }
    if (isPublished !== undefined) page.isPublished = Boolean(isPublished);

    await page.save();

    res.status(200).json({
      success: true,
      message: 'Status page updated successfully.',
      data: page
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicStatusPage,
  getMyStatusPage,
  updateMyStatusPage
};
