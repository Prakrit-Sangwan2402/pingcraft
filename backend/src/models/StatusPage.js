const mongoose = require('mongoose');

const statusPageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'],
      minlength: [3, 'Slug must be at least 3 characters'],
      maxlength: [60, 'Slug cannot exceed 60 characters']
    },
    title: {
      type: String,
      required: [true, 'Status page title is required'],
      default: 'System Status',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      default: 'Real-time operational status and incident history.',
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    monitors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor'
      }
    ],
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const StatusPage = mongoose.model('StatusPage', statusPageSchema);

module.exports = StatusPage;
