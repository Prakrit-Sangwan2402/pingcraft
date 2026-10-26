const mongoose = require('mongoose');

const pingLogSchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    statusCode: {
      type: Number,
      default: null
    },
    latencyMs: {
      type: Number,
      required: true
    },
    success: {
      type: Boolean,
      required: true,
      index: true
    },
    errorCategory: {
      type: String,
      enum: [
        'NONE',
        'HTTP_ERROR',
        'TIMEOUT',
        'DNS_ERROR',
        'CONNECTION_ERROR',
        'TLS_ERROR',
        'PAYLOAD_ERROR',
        'SSRF_BLOCKED',
        'UNKNOWN'
      ],
      default: 'NONE'
    },
    errorMessage: {
      type: String,
      default: null,
      maxlength: 500
    },
    responseSize: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for time-window telemetry queries (24h, 7d calculations)
pingLogSchema.index({ monitorId: 1, createdAt: -1 });
pingLogSchema.index({ monitorId: 1, timestamp: -1 });

// TTL retention index: automatically prune logs older than 30 days (2,592,000 seconds)
pingLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const PingLog = mongoose.model('PingLog', pingLogSchema);

module.exports = PingLog;
