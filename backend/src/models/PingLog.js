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

pingLogSchema.index({ monitorId: 1, createdAt: -1 });
pingLogSchema.index({ monitorId: 1, timestamp: -1 });
pingLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const PingLog = mongoose.model('PingLog', pingLogSchema);

module.exports = PingLog;
