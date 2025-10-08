/**
 * Insight Model
 * 
 * Represents AI-generated insights and recommendations
 * for projects and lifecycle assessments.
 * 
 * @module models/Insight
 */

const mongoose = require('mongoose');

/**
 * Insight Schema
 * 
 * @typedef {Object} Insight
 * @property {string} type - Type of insight
 * @property {string} title - Insight title
 * @property {string} description - Detailed insight description
 * @property {number} confidenceScore - AI confidence score (0-1)
 * @property {ObjectId} relatedProjectId - Reference to related project
 * @property {Object} action - Recommended action details
 * @property {string} priority - Insight priority level
 * @property {Date} createdAt - Insight creation timestamp
 */
const insightSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Insight type is required'],
      enum: {
        values: [
          'optimization',
          'risk',
          'opportunity',
          'compliance',
          'sustainability',
          'cost-reduction',
          'efficiency',
          'warning'
        ],
        message: '{VALUE} is not a valid insight type'
      }
    },

    title: {
      type: String,
      required: [true, 'Insight title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
      type: String,
      required: [true, 'Insight description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score must be between 0 and 1'],
      max: [1, 'Confidence score must be between 0 and 1'],
      default: 0.5
    },

    relatedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Related project ID is required'],
      index: true
    },

    action: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'medium'
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

// Index for finding insights by project
insightSchema.index({ relatedProjectId: 1 });

// Compound index for filtering by type and priority
insightSchema.index({ type: 1, priority: 1 });

// Index for sorting by confidence score
insightSchema.index({ confidenceScore: -1 });

// Index for recent insights
insightSchema.index({ createdAt: -1 });

// Compound index for high-priority insights by project
insightSchema.index({ relatedProjectId: 1, priority: 1, createdAt: -1 });

/**
 * Virtual Properties
 */

// Virtual for confidence percentage
insightSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidenceScore * 100);
});

// Virtual for insight summary
insightSchema.virtual('summary').get(function() {
  return {
    type: this.type,
    title: this.title,
    priority: this.priority,
    confidence: this.confidencePercentage
  };
});

/**
 * Instance Methods
 */

/**
 * Check if insight is actionable (high confidence and medium+ priority)
 * @returns {boolean}
 */
insightSchema.methods.isActionable = function() {
  return this.confidenceScore >= 0.7 && ['medium', 'high', 'critical'].includes(this.priority);
};

/**
 * Check if insight requires immediate attention
 * @returns {boolean}
 */
insightSchema.methods.isCritical = function() {
  return this.priority === 'critical' || (this.priority === 'high' && this.confidenceScore >= 0.8);
};

/**
 * Get formatted insight for display
 * @returns {Object}
 */
insightSchema.methods.format = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    description: this.description,
    confidence: `${this.confidencePercentage}%`,
    priority: this.priority,
    createdAt: this.createdAt,
    actionable: this.isActionable(),
    critical: this.isCritical()
  };
};

/**
 * Static Methods
 */

/**
 * Get high-priority insights for a project
 * @param {ObjectId} projectId - Project ID
 * @returns {Promise<Insight[]>}
 */
insightSchema.statics.getHighPriorityByProject = function(projectId) {
  return this.find({
    relatedProjectId: projectId,
    priority: { $in: ['high', 'critical'] }
  })
    .sort({ priority: -1, confidenceScore: -1 })
    .limit(10);
};

/**
 * Insight Model
 * @type {mongoose.Model<Insight>}
 */
const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;
