/**
 * Project Model
 * 
 * Represents a project with lifecycle assessment data,
 * including circularity scores and environmental impact metrics.
 * 
 * @module models/Project
 */

const mongoose = require('mongoose');

/**
 * Project Schema
 * 
 * @typedef {Object} Project
 * @property {string} name - Project name
 * @property {string} metalType - Type of metal used in the project
 * @property {string} processType - Manufacturing/processing type
 * @property {number} circularityScore - Circularity assessment score (0-100)
 * @property {number} gwp - Global Warming Potential value
 * @property {string} status - Current project status
 * @property {ObjectId} owner - Reference to the user who owns this project
 * @property {Date} lastModified - Last modification timestamp
 * @property {Date} createdAt - Project creation timestamp
 * @property {Object} metadata - Additional project metadata
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters long'],
      maxlength: [200, 'Project name cannot exceed 200 characters']
    },

    metalType: {
      type: String,
      required: [true, 'Metal type is required'],
      trim: true,
      maxlength: [100, 'Metal type cannot exceed 100 characters']
    },

    processType: {
      type: String,
      trim: true,
      maxlength: [100, 'Process type cannot exceed 100 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    circularityScore: {
      type: Number,
      min: [0, 'Circularity score cannot be negative'],
      max: [100, 'Circularity score cannot exceed 100'],
      default: 0
    },

    gwp: {
      type: Number,
      min: [0, 'GWP cannot be negative'],
      default: 0
    },

    gwpSaved: {
      type: Number,
      min: [0, 'GWP saved cannot be negative'],
      default: 0
    },

    co2Emissions: {
      type: Number,
      min: [0, 'CO2 emissions cannot be negative'],
      default: 0
    },

    energyConsumption: {
      type: Number,
      min: [0, 'Energy consumption cannot be negative'],
      default: 0
    },

    waterUsage: {
      type: Number,
      min: [0, 'Water usage cannot be negative'],
      default: 0
    },

    wasteGenerated: {
      type: Number,
      min: [0, 'Waste generated cannot be negative'],
      default: 0
    },

    recyclingRate: {
      type: Number,
      min: [0, 'Recycling rate cannot be negative'],
      max: [100, 'Recycling rate cannot exceed 100'],
      default: 0
    },

    wizardWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WizardWorkflow',
      index: true
    },

    status: {
      type: String,
      required: [true, 'Project status is required'],
      enum: {
        values: ['draft', 'in-progress', 'completed', 'archived'],
        message: '{VALUE} is not a valid status'
      },
      default: 'draft'
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required']
      // Index defined separately below
    },

    lastModified: {
      type: Date,
      default: Date.now
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

// Text index on name for full-text search
projectSchema.index({ name: 'text' });

// Index for owner lookups
projectSchema.index({ owner: 1 });

// Compound index for filtering by owner and status
projectSchema.index({ owner: 1, status: 1 });

// Index for sorting by circularity score
projectSchema.index({ circularityScore: -1 });

// Index for filtering by metal and process types
projectSchema.index({ metalType: 1, processType: 1 });

// Index for recent projects
projectSchema.index({ lastModified: -1 });

/**
 * Virtual Properties
 */

// Virtual for project summary
projectSchema.virtual('summary').get(function() {
  return {
    name: this.name,
    metalType: this.metalType,
    processType: this.processType,
    circularityScore: this.circularityScore,
    status: this.status,
    lastModified: this.lastModified
  };
});

/**
 * Instance Methods
 */

/**
 * Update last modified timestamp
 * @returns {Promise<Project>}
 */
projectSchema.methods.touch = function() {
  this.lastModified = new Date();
  return this.save();
};

/**
 * Check if project is editable
 * @returns {boolean}
 */
projectSchema.methods.isEditable = function() {
  return ['draft', 'in-progress'].includes(this.status);
};

/**
 * Get environmental impact rating
 * @returns {string} Rating: 'excellent', 'good', 'fair', 'poor'
 */
projectSchema.methods.getImpactRating = function() {
  if (this.circularityScore >= 80) return 'excellent';
  if (this.circularityScore >= 60) return 'good';
  if (this.circularityScore >= 40) return 'fair';
  return 'poor';
};

/**
 * Pre-save middleware
 */

// Update lastModified on save
projectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

/**
 * Project Model
 * @type {mongoose.Model<Project>}
 */
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
