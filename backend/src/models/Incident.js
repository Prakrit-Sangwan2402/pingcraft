const mongoose = require('mongoose');

const incidentTimelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    actor: {
      type: String,
      enum: ['SYSTEM', 'USER'],
      default: 'SYSTEM'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['TRIGGERED', 'INVESTIGATING', 'MITIGATING', 'RESOLVED'],
      default: 'TRIGGERED',
      index: true
    },
    startedAt: {
      type: Date,
      required: true,
      comment: 'Timestamp of the first observed probe failure in this outage'
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      comment: 'Timestamp when consecutive failure threshold was reached and incident was opened'
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true
    },
    durationSeconds: {
      type: Number,
      default: null
    },
    triggerReason: {
      type: String,
      required: true,
      maxlength: 500
    },
    resolutionReason: {
      type: String,
      default: null,
      maxlength: 500
    },
    timeline: [incidentTimelineEventSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for querying unresolved vs resolved incidents per monitor
incidentSchema.index({ monitorId: 1, status: 1 });
incidentSchema.index({ userId: 1, createdAt: -1 });

// Partial unique index: A monitor can have AT MOST ONE unresolved incident (resolvedAt === null)
incidentSchema.index(
  { monitorId: 1, resolvedAt: 1 },
  { unique: true, partialFilterExpression: { resolvedAt: null } }
);

const Incident = mongoose.model('Incident', incidentSchema);

module.exports = Incident;
