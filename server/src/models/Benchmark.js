/**
 * Benchmark Model
 * 
 * Represents benchmark data for comparing user performance
 * against industry standards and peers.
 * 
 * @module models/Benchmark
 */

const mongoose = require('mongoose');

/**
 * Benchmark Schema
 * 
 * @typedef {Object} Benchmark
 * @property {number} userAverageCircularity - User's average circularity score
 * @property {number} industryMedianCircularity - Industry median circularity score
 * @property {number} userPercentile - User's percentile ranking
 * @property {string[]} comparisonSectors - Sectors included in comparison
 * @property {Date} lastUpdated - Last update timestamp
 */
const benchmarkSchema = new mongoose.Schema(
  {
    userAverageCircularity: {
      type: Number,
      required: [true, 'User average circularity is required'],
      min: [0, 'Average circularity cannot be negative'],
      max: [100, 'Average circularity cannot exceed 100']
    },

    industryMedianCircularity: {
      type: Number,
      required: [true, 'Industry median circularity is required'],
      min: [0, 'Industry median cannot be negative'],
      max: [100, 'Industry median cannot exceed 100']
    },

    userPercentile: {
      type: Number,
      required: [true, 'User percentile is required'],
      min: [0, 'Percentile cannot be less than 0'],
      max: [100, 'Percentile cannot exceed 100']
    },

    comparisonSectors: {
      type: [String],
      default: [],
      validate: {
        validator: function(sectors) {
          return sectors.length > 0;
        },
        message: 'At least one comparison sector is required'
      }
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
      required: [true, 'Last updated timestamp is required']
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },

    period: {
      type: String,
      enum: {
        values: ['monthly', 'quarterly', 'yearly'],
        message: '{VALUE} is not a valid period'
      },
      default: 'monthly'
    },

    projectCount: {
      type: Number,
      default: 0,
      min: [0, 'Project count cannot be negative']
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

// Index for user lookups
benchmarkSchema.index({ userId: 1 });

// Compound index for user and period
benchmarkSchema.index({ userId: 1, period: 1 });

// Index for recent benchmarks
benchmarkSchema.index({ lastUpdated: -1 });

/**
 * Virtual Properties
 */

// Virtual for performance gap
benchmarkSchema.virtual('performanceGap').get(function() {
  return this.userAverageCircularity - this.industryMedianCircularity;
});

// Virtual for performance rating
benchmarkSchema.virtual('performanceRating').get(function() {
  if (this.userPercentile >= 90) return 'excellent';
  if (this.userPercentile >= 75) return 'above-average';
  if (this.userPercentile >= 50) return 'average';
  if (this.userPercentile >= 25) return 'below-average';
  return 'needs-improvement';
});

// Virtual for benchmark age in days
benchmarkSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.lastUpdated);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Instance Methods
 */

/**
 * Check if benchmark data is stale (older than 30 days)
 * @returns {boolean}
 */
benchmarkSchema.methods.isStale = function() {
  return this.ageInDays > 30;
};

/**
 * Check if user is performing above industry median
 * @returns {boolean}
 */
benchmarkSchema.methods.isAboveMedian = function() {
  return this.userAverageCircularity > this.industryMedianCircularity;
};

/**
 * Get formatted benchmark summary
 * @returns {Object}
 */
benchmarkSchema.methods.getSummary = function() {
  return {
    userAverage: this.userAverageCircularity.toFixed(2),
    industryMedian: this.industryMedianCircularity.toFixed(2),
    percentile: this.userPercentile,
    rating: this.performanceRating,
    gap: this.performanceGap.toFixed(2),
    sectors: this.comparisonSectors,
    lastUpdated: this.lastUpdated,
    isStale: this.isStale()
  };
};

/**
 * Pre-save middleware
 */

// Update lastUpdated timestamp
benchmarkSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

/**
 * Static Methods
 */

/**
 * Get latest benchmark for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Benchmark>}
 */
benchmarkSchema.statics.getLatestForUser = function(userId) {
  return this.findOne({ userId }).sort({ lastUpdated: -1 });
};

/**
 * Get benchmarks by period for a user
 * @param {ObjectId} userId - User ID
 * @param {string} period - Period type
 * @returns {Promise<Benchmark[]>}
 */
benchmarkSchema.statics.getByPeriod = function(userId, period) {
  return this.find({ userId, period }).sort({ lastUpdated: -1 }).limit(12);
};

/**
 * Benchmark Model
 * @type {mongoose.Model<Benchmark>}
 */
const Benchmark = mongoose.model('Benchmark', benchmarkSchema);

module.exports = Benchmark;
