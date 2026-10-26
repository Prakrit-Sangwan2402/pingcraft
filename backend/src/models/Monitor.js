const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: [true, 'Target URL is required'],
      trim: true
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
      default: 'GET'
    },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    body: {
      type: String,
      default: null,
      maxlength: [10240, 'Body payload cannot exceed 10KB']
    },
    expectedStatusCode: {
      type: Number,
      default: 200,
      min: [100, 'Expected status code must be >= 100'],
      max: [599, 'Expected status code must be <= 599']
    },
    timeoutMs: {
      type: Number,
      default: 10000,
      min: [1000, 'Timeout must be at least 1000ms (1s)'],
      max: [30000, 'Timeout cannot exceed 30000ms (30s)']
    },
    intervalSeconds: {
      type: Number,
      default: 60,
      min: [10, 'Interval must be at least 10 seconds'],
      max: [3600, 'Interval cannot exceed 3600 seconds']
    },
    failureThreshold: {
      type: Number,
      default: 2,
      min: [1, 'Failure threshold must be >= 1'],
      max: [10, 'Failure threshold must be <= 10']
    },
    recoveryThreshold: {
      type: Number,
      default: 2,
      min: [1, 'Recovery threshold must be >= 1'],
      max: [10, 'Recovery threshold must be <= 10']
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    },
    consecutiveSuccesses: {
      type: Number,
      default: 0
    },
    firstObservedFailureAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['OPERATIONAL', 'DEGRADED', 'DOWN', 'PAUSED'],
      default: 'OPERATIONAL',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isPaused: {
      type: Boolean,
      default: false,
      index: true
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    lastCheckedAt: {
      type: Date,
      default: null
    },
    lastStatusCode: {
      type: Number,
      default: null
    },
    lastLatencyMs: {
      type: Number,
      default: null
    },
    lastError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-frequency queries
monitorSchema.index({ userId: 1, createdAt: -1 });
monitorSchema.index({ isActive: 1, isPaused: 1, lastCheckedAt: 1 });

const Monitor = mongoose.model('Monitor', monitorSchema);

module.exports = Monitor;
