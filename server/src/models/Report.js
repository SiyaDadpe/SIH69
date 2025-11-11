/**
 * Report Model
 * 
 * Mongoose schema for storing sustainability and circularity reports
 * with embedded sections, metrics, and attachments.
 * 
 * @module models/Report
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Report Metric Schema (embedded)
 * Represents individual metrics within report sections
 */
const ReportMetricSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Metric name is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Metric label is required'],
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Metric value is required']
  },
  unit: {
    type: String,
    trim: true
  },
  baseline: {
    type: Number
  },
  change: {
    type: Number
  },
  details: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

/**
 * Report Section Schema (embedded)
 * Represents individual sections within a report
 */
const ReportSectionSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  content: {
    type: String,
    trim: true
  },
  charts: [{
    type: {
      type: String,
      enum: ['bar', 'line', 'pie', 'scatter', 'area', 'donut', 'radar'],
      default: 'bar'
    },
    dataRef: Schema.Types.Mixed,
    title: String,
    description: String
  }],
  metrics: [ReportMetricSchema],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { _id: true });

/**
 * Report Schema
 * Main schema for sustainability and circularity reports
 */
const ReportSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description must not exceed 2000 characters']
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
    // Index defined separately below
  },
  // User who created this report
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  // Legacy author field - kept for backward compatibility
  author: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'final', 'archived'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
    // Index defined separately below
  },
  visibility: {
    type: String,
    enum: {
      values: ['private', 'project', 'public'],
      message: '{VALUE} is not a valid visibility level'
    },
    default: 'public'
    // Index defined separately below
  },
  sections: [ReportSectionSchema],
  circularityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  co2Savings: {
    type: Number,
    min: 0,
    default: null
  },
  summary: {
    type: Schema.Types.Mixed,
    default: {
      circularityScore: null,
      gwp: null,
      energyDemand: null,
      waterConsumption: null,
      costAnalysis: {},
      keyFindings: [],
      recommendations: []
    }
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  publishedAt: {
    type: Date
  },
  schemaVersion: {
    type: String,
    default: '1.0'
  },
  // For frontend compatibility
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// VIRTUALS FOR FRONTEND COMPATIBILITY
ReportSchema.virtual('id').get(function() {
  return this._id;
});

// Ensure 'name' always returns title if not set
ReportSchema.virtual('name').get(function() {
  return this.name || this.title;
});

// Ensure 'category' is derived from status if not set
ReportSchema.virtual('category').get(function() {
  if (this.category) return this.category;
  if (this.status === 'archived') return 'archived';
  if (this.status === 'final') return 'completed';
  return 'active';
});

// Ensure 'version' is always available
ReportSchema.virtual('version').get(function() {
  return this.version || this.schemaVersion || '1.0';
});

// Ensure summary fields for frontend
ReportSchema.virtual('frontendSummary').get(function() {
  return {
    circularityScore: this.summary?.circularityScore ?? null,
    gwp: this.summary?.gwp ?? null,
    energyDemand: this.summary?.energyDemand ?? null,
    waterConsumption: this.summary?.waterConsumption ?? null,
    costAnalysis: this.summary?.costAnalysis ?? {},
    keyFindings: this.summary?.keyFindings ?? [],
    recommendations: this.summary?.recommendations ?? []
  };
});
// INDEXES
// ============================================================================

// Compound index for efficient querying
ReportSchema.index({ projectId: 1, visibility: 1, status: 1, updatedAt: -1 });

// Text index for search functionality
ReportSchema.index({ title: 'text', 'sections.content': 'text', description: 'text' });

// Tag index for filtering
ReportSchema.index({ tags: 1 });

// Status and visibility for quick filtering
ReportSchema.index({ status: 1, visibility: 1 });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Virtual for total metrics count across all sections
 */
ReportSchema.virtual('totalMetrics').get(function() {
  return this.sections.reduce((total, section) => {
    return total + (section.metrics ? section.metrics.length : 0);
  }, 0);
});

/**
 * Virtual for total sections count
 */
ReportSchema.virtual('totalSections').get(function() {
  return this.sections.length;
});

/**
 * Virtual to check if report is published
 */
ReportSchema.virtual('isPublished').get(function() {
  return this.status === 'final' && this.publishedAt != null;
});

// ============================================================================
// METHODS
// ============================================================================

/**
 * Calculate and update the summary field from sections and metrics
 */
ReportSchema.methods.updateSummary = function() {
  const summary = {
    totalSections: this.sections.length,
    totalMetrics: 0,
    metricsByType: {},
    averageValues: {}
  };

  this.sections.forEach(section => {
    if (section.metrics && section.metrics.length > 0) {
      section.metrics.forEach(metric => {
        summary.totalMetrics++;
        
        // Count metrics by name
        if (!summary.metricsByType[metric.name]) {
          summary.metricsByType[metric.name] = 0;
        }
        summary.metricsByType[metric.name]++;

        // Calculate average for numeric values
        if (typeof metric.value === 'number') {
          if (!summary.averageValues[metric.name]) {
            summary.averageValues[metric.name] = { sum: 0, count: 0, unit: metric.unit };
          }
          summary.averageValues[metric.name].sum += metric.value;
          summary.averageValues[metric.name].count++;
        }
      });
    }
  });

  // Calculate final averages
  Object.keys(summary.averageValues).forEach(key => {
    const avg = summary.averageValues[key];
    summary.averageValues[key] = {
      average: (avg.sum / avg.count).toFixed(2),
      unit: avg.unit
    };
  });

  this.summary = summary;
  return summary;
};

/**
 * Publish the report
 */
ReportSchema.methods.publish = function() {
  this.status = 'final';
  this.publishedAt = new Date();
  this.updateSummary();
  return this.save();
};

/**
 * Archive the report
 */
ReportSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// ============================================================================
// MIDDLEWARE HOOKS
// ============================================================================

/**
 * Pre-save middleware to update summary before saving
 */
ReportSchema.pre('save', function(next) {
  // Update summary if sections have been modified
  if (this.isModified('sections') || this.isNew) {
    this.updateSummary();
  }
  next();
});

/**
 * Pre-save middleware to sort sections by order
 */
ReportSchema.pre('save', function(next) {
  if (this.sections && this.sections.length > 0) {
    this.sections.sort((a, b) => a.order - b.order);
  }
  next();
});

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find reports by project ID
 */
ReportSchema.statics.findByProject = function(projectId, options = {}) {
  const query = this.find({ projectId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.visibility) {
    query.where('visibility').equals(options.visibility);
  }
  
  return query.sort('-updatedAt').exec();
};

/**
 * Search reports by text
 */
ReportSchema.statics.searchReports = function(searchText, options = {}) {
  const query = this.find({ $text: { $search: searchText } });
  
  if (options.visibility) {
    query.where('visibility').equals(options.visibility);
  }
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  return query
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .exec();
};

/**
 * Get aggregated statistics
 */
ReportSchema.statics.getStatistics = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        byStatus: {
          $push: '$status'
        },
        byVisibility: {
          $push: '$visibility'
        },
        totalSections: { $sum: { $size: '$sections' } },
        totalAttachments: { $sum: { $size: '$attachments' } }
      }
    }
  ]);

  const statusCount = await this.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const visibilityCount = await this.aggregate([
    { $match: filter },
    { $group: { _id: '$visibility', count: { $sum: 1 } } }
  ]);

  const result = stats[0] || {
    totalReports: 0,
    totalSections: 0,
    totalAttachments: 0
  };

  const statusCounts = statusCount.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const visibilityCounts = visibilityCount.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalReports: result.totalReports,
    totalSections: result.totalSections,
    totalAttachments: result.totalAttachments,
    byStatus: statusCounts,
    byVisibility: visibilityCounts
  };
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;
