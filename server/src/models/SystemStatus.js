/**
 * SystemStatus Model
 * 
 * Represents the overall system status, including data freshness,
 * new features, maintenance schedules, and API health.
 * 
 * @module models/SystemStatus
 */

const mongoose = require('mongoose');

/**
 * Feature Schema
 * Sub-document schema for new features
 */
const featureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Feature title is required'],
      trim: true,
      maxlength: [200, 'Feature title cannot exceed 200 characters']
    },

    description: {
      type: String,
      required: [true, 'Feature description is required'],
      trim: true,
      maxlength: [1000, 'Feature description cannot exceed 1000 characters']
    },

    releaseDate: {
      type: Date,
      default: Date.now
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { _id: true }
);

/**
 * SystemStatus Schema
 * 
 * @typedef {Object} SystemStatus
 * @property {Date} dataLastUpdated - Timestamp of last data update
 * @property {Object[]} newFeatures - Array of new features
 * @property {Date} maintenanceSchedule - Scheduled maintenance timestamp
 * @property {string} apiStatus - Current API operational status
 */
const systemStatusSchema = new mongoose.Schema(
  {
    dataLastUpdated: {
      type: Date,
      required: [true, 'Data last updated timestamp is required'],
      default: Date.now
    },

    newFeatures: {
      type: [featureSchema],
      default: []
    },

    maintenanceSchedule: {
      type: Date,
      default: null
    },

    apiStatus: {
      type: String,
      required: [true, 'API status is required'],
      enum: {
        values: ['operational', 'degraded', 'outage'],
        message: '{VALUE} is not a valid API status'
      },
      default: 'operational'
    },

    serviceHealth: {
      database: {
        type: String,
        enum: ['operational', 'degraded', 'outage'],
        default: 'operational'
      },
      cache: {
        type: String,
        enum: ['operational', 'degraded', 'outage'],
        default: 'operational'
      },
      externalAPIs: {
        type: String,
        enum: ['operational', 'degraded', 'outage'],
        default: 'operational'
      }
    },

    metrics: {
      activeUsers: {
        type: Number,
        default: 0,
        min: [0, 'Active users cannot be negative']
      },
      totalProjects: {
        type: Number,
        default: 0,
        min: [0, 'Total projects cannot be negative']
      },
      avgResponseTime: {
        type: Number,
        default: 0,
        min: [0, 'Average response time cannot be negative']
      }
    },

    alerts: {
      type: [
        {
          level: {
            type: String,
            enum: ['info', 'warning', 'error', 'critical'],
            required: true
          },
          message: {
            type: String,
            required: true,
            maxlength: 500
          },
          timestamp: {
            type: Date,
            default: Date.now
          },
          resolved: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Indexes
 */

// Index for API status lookups
systemStatusSchema.index({ apiStatus: 1 });

// Index for recent status updates
systemStatusSchema.index({ updatedAt: -1 });

// Index for maintenance schedule
systemStatusSchema.index({ maintenanceSchedule: 1 });

/**
 * Virtual Properties
 */

// Virtual for overall system health
systemStatusSchema.virtual('overallHealth').get(function() {
  const statuses = [
    this.apiStatus,
    this.serviceHealth.database,
    this.serviceHealth.cache,
    this.serviceHealth.externalAPIs
  ];

  if (statuses.includes('outage')) return 'critical';
  if (statuses.includes('degraded')) return 'degraded';
  return 'operational';
});

// Virtual for active features
systemStatusSchema.virtual('activeFeatures').get(function() {
  return this.newFeatures.filter(feature => feature.isActive);
});

// Virtual for data freshness
systemStatusSchema.virtual('dataFreshnessHours').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.dataLastUpdated);
  return Math.round(diffTime / (1000 * 60 * 60));
});

// Virtual for unresolved alerts
systemStatusSchema.virtual('unresolvedAlerts').get(function() {
  return this.alerts.filter(alert => !alert.resolved);
});

/**
 * Instance Methods
 */

/**
 * Check if data is stale (older than 24 hours)
 * @returns {boolean}
 */
systemStatusSchema.methods.isDataStale = function() {
  return this.dataFreshnessHours > 24;
};

/**
 * Check if system is healthy
 * @returns {boolean}
 */
systemStatusSchema.methods.isHealthy = function() {
  return this.overallHealth === 'operational';
};

/**
 * Check if maintenance is upcoming (within next 24 hours)
 * @returns {boolean}
 */
systemStatusSchema.methods.hasUpcomingMaintenance = function() {
  if (!this.maintenanceSchedule) return false;
  const now = new Date();
  const diff = this.maintenanceSchedule - now;
  const hoursUntilMaintenance = diff / (1000 * 60 * 60);
  return hoursUntilMaintenance > 0 && hoursUntilMaintenance <= 24;
};

/**
 * Add a new feature
 * @param {Object} feature - Feature object with title and description
 * @returns {Promise<SystemStatus>}
 */
systemStatusSchema.methods.addFeature = function(feature) {
  this.newFeatures.push(feature);
  return this.save();
};

/**
 * Add an alert
 * @param {string} level - Alert level
 * @param {string} message - Alert message
 * @returns {Promise<SystemStatus>}
 */
systemStatusSchema.methods.addAlert = function(level, message) {
  this.alerts.push({ level, message, timestamp: new Date() });
  return this.save();
};

/**
 * Get status summary
 * @returns {Object}
 */
systemStatusSchema.methods.getSummary = function() {
  return {
    overallHealth: this.overallHealth,
    apiStatus: this.apiStatus,
    serviceHealth: this.serviceHealth,
    dataLastUpdated: this.dataLastUpdated,
    dataStale: this.isDataStale(),
    maintenanceSchedule: this.maintenanceSchedule,
    upcomingMaintenance: this.hasUpcomingMaintenance(),
    activeFeatures: this.activeFeatures.length,
    unresolvedAlerts: this.unresolvedAlerts.length,
    metrics: this.metrics
  };
};

/**
 * Static Methods
 */

/**
 * Get current system status (most recent)
 * @returns {Promise<SystemStatus>}
 */
systemStatusSchema.statics.getCurrent = function() {
  return this.findOne().sort({ updatedAt: -1 });
};

/**
 * Create or update system status
 * @param {Object} statusData - Status data
 * @returns {Promise<SystemStatus>}
 */
systemStatusSchema.statics.updateStatus = async function(statusData) {
  const current = await this.getCurrent();
  
  if (current) {
    Object.assign(current, statusData);
    return current.save();
  }
  
  return this.create(statusData);
};

/**
 * SystemStatus Model
 * @type {mongoose.Model<SystemStatus>}
 */
const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema);

module.exports = SystemStatus;
