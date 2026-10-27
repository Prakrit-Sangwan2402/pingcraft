const Incident = require('../models/Incident');
const { transitionIncidentStatus } = require('../services/incidentService');

async function getIncidents(req, res, next) {
  try {
    const userId = req.user._id;
    const { status, monitorId, page = 1, limit = 20 } = req.query;

    const query = { userId };

    if (status && ['TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (monitorId) {
      query.monitorId = monitorId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .populate('monitorId', 'name url status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Incident.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: incidents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;
    const incident = await Incident.findOne({ _id: id, userId: req.user._id })
      .populate('monitorId', 'name url status expectedStatusCode intervalSeconds')
      .lean();

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found or unauthorized.'
      });
    }

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
}

async function updateIncidentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { nextStatus, message } = req.body;

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: 'nextStatus is required (INVESTIGATING, MITIGATING, or RESOLVED).'
      });
    }

    const updatedIncident = await transitionIncidentStatus(
      id,
      req.user._id,
      nextStatus.toUpperCase(),
      message
    );

    res.status(200).json({
      success: true,
      message: `Incident status transitioned to ${nextStatus}.`,
      data: updatedIncident
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncidentStatus
};
