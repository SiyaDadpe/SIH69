/**
 * Calculate LCA Model
 * 
 * Mongoose schema for storing Life Cycle Assessment calculation results
 * and generated PDF reports linked to users.
 * 
 * @module models/CalculateLCA
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Impact Breakdown Schema
 * Stores detailed impact metrics by category
 */
const ImpactBreakdownSchema = new Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

/**
 * Stage Data Schema
 * Stores metrics for individual production stages
 */
const StageDataSchema = new Schema({
  stageName: {
    type: String,
    required: true,
    enum: ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'],
    trim: true
  },
  energyConsumption: {
    type: Number,
    default: 0
  },
  co2Emissions: {
    type: Number,
    default: 0
  },
  waterUsage: {
    type: Number,
    default: 0
  },
  wasteGeneration: {
    type: Number,
    default: 0
  },
  airQualityImpact: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Recommendation Schema
 * Stores recommendations for improvement
 */
const RecommendationSchema = new Schema({
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

/**
 * Calculate LCA Schema
 * Main schema for LCA calculation results
 */
const CalculateLCASchema = new Schema({
  // User reference
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  // Workflow reference (optional)
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: 'WizardWorkflow',
    index: true
  },

  // Project details
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters'],
    maxlength: [200, 'Project name must not exceed 200 characters']
  },

  location: {
    type: String,
    trim: true,
    default: 'Not specified'
  },

  metalType: {
    type: String,
    trim: true,
    default: 'Aluminium'
  },

  analysisDate: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Overall metrics
  totalEnergyConsumption: {
    type: Number,
    default: 0,
    min: [0, 'Total energy consumption cannot be negative']
  },

  totalCO2Emissions: {
    type: Number,
    default: 0,
    min: [0, 'Total CO2 emissions cannot be negative']
  },

  totalWaterUsage: {
    type: Number,
    default: 0,
    min: [0, 'Total water usage cannot be negative']
  },

  totalWasteGeneration: {
    type: Number,
    default: 0,
    min: [0, 'Total waste generation cannot be negative']
  },

  totalAirQualityImpact: {
    type: Number,
    default: 0,
    min: [0, 'Total air quality impact cannot be negative']
  },

  // Intensity metrics (per kg aluminum)
  energyIntensity: {
    type: Number,
    default: 0,
    min: [0, 'Energy intensity cannot be negative']
  },

  carbonIntensity: {
    type: Number,
    default: 0,
    min: [0, 'Carbon intensity cannot be negative']
  },

  // Circularity metrics
  circularityScore: {
    type: Number,
    default: 0,
    min: [0, 'Circularity score cannot be negative'],
    max: [100, 'Circularity score cannot exceed 100']
  },

  circularityRating: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'],
    default: 'Fair'
  },

  materialRecoveryRate: {
    type: Number,
    default: 0,
    min: [0, 'Material recovery rate cannot be negative'],
    max: [100, 'Material recovery rate cannot exceed 100']
  },

  // Stage-wise data
  stageData: [StageDataSchema],

  // Impact breakdown by category
  impactBreakdown: [ImpactBreakdownSchema],

  // Recommendations
  recommendations: [RecommendationSchema],

  // PDF report details
  pdfReportUrl: {
    type: String,
    trim: true
  },

  pdfFilename: {
    type: String,
    trim: true
  },

  pdfFileSize: {
    type: Number,
    min: 0
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    index: true
  },

  // Additional metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },

  // Calculation parameters used
  calculationParams: {
    type: Schema.Types.Mixed,
    default: {}
  },

  // Error information (if calculation failed)
  errorMessage: {
    type: String,
    trim: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'calculatelca' // Use singular form instead of default 'calculatelcas'
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for efficient querying
CalculateLCASchema.index({ userId: 1, analysisDate: -1 });
CalculateLCASchema.index({ userId: 1, status: 1 });
CalculateLCASchema.index({ workflowId: 1 });

// ============================================================================
// VIRTUALS
// ============================================================================

/**
 * Virtual for report ID (alias for _id)
 */
CalculateLCASchema.virtual('reportId').get(function() {
  return this._id;
});

/**
 * Virtual to check if report has been generated
 */
CalculateLCASchema.virtual('hasReport').get(function() {
  return !!this.pdfReportUrl && this.status === 'completed';
});

/**
 * Virtual for formatted analysis date
 */
CalculateLCASchema.virtual('formattedAnalysisDate').get(function() {
  if (!this.analysisDate) return '';
  return this.analysisDate.toISOString().split('T')[0];
});

// ============================================================================
// METHODS
// ============================================================================

/**
 * Get summary object for API responses
 * @returns {Object} Summary data
 */
CalculateLCASchema.methods.getSummary = function() {
  return {
    reportId: this._id,
    projectName: this.projectName,
    location: this.location,
    analysisDate: this.analysisDate,
    totalEnergy: this.totalEnergyConsumption,
    totalCO2: this.totalCO2Emissions,
    energyIntensity: this.energyIntensity,
    carbonIntensity: this.carbonIntensity,
    circularityScore: this.circularityScore,
    circularityRating: this.circularityRating,
    materialRecoveryRate: this.materialRecoveryRate,
    pdfUrl: this.pdfReportUrl,
    status: this.status,
    createdAt: this.createdAt
  };
};

/**
 * Mark calculation as completed
 * @param {string} pdfUrl - URL to the generated PDF
 * @param {string} filename - Filename of the PDF
 * @param {number} fileSize - Size of the PDF file in bytes
 */
CalculateLCASchema.methods.markCompleted = function(pdfUrl, filename, fileSize) {
  this.status = 'completed';
  this.pdfReportUrl = pdfUrl;
  this.pdfFilename = filename;
  this.pdfFileSize = fileSize;
  return this.save();
};

/**
 * Mark calculation as failed
 * @param {string} errorMessage - Error message
 */
CalculateLCASchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Get all LCA reports for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} Array of LCA reports
 */
CalculateLCASchema.statics.findByUser = function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sort = { analysisDate: -1 },
    status = null
  } = options;

  const query = { userId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select('-__v')
    .lean();
};

/**
 * Get LCA report statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Statistics
 */
CalculateLCASchema.statics.getUserStats = async function(userId) {
  const reports = await this.find({ userId, status: 'completed' });
  
  if (reports.length === 0) {
    return {
      totalReports: 0,
      averageCircularityScore: 0,
      averageCO2Emissions: 0,
      totalEnergyConsumed: 0
    };
  }

  const totalCircularity = reports.reduce((sum, r) => sum + (r.circularityScore || 0), 0);
  const totalCO2 = reports.reduce((sum, r) => sum + (r.totalCO2Emissions || 0), 0);
  const totalEnergy = reports.reduce((sum, r) => sum + (r.totalEnergyConsumption || 0), 0);

  return {
    totalReports: reports.length,
    averageCircularityScore: Math.round((totalCircularity / reports.length) * 10) / 10,
    averageCO2Emissions: Math.round((totalCO2 / reports.length) * 100) / 100,
    totalEnergyConsumed: Math.round(totalEnergy * 100) / 100
  };
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Pre-save hook to calculate derived fields
 */
CalculateLCASchema.pre('save', function(next) {
  // Calculate circularity rating based on score
  if (this.isModified('circularityScore')) {
    if (this.circularityScore >= 80) {
      this.circularityRating = 'Excellent';
    } else if (this.circularityScore >= 65) {
      this.circularityRating = 'Good';
    } else if (this.circularityScore >= 45) {
      this.circularityRating = 'Fair';
    } else if (this.circularityScore >= 25) {
      this.circularityRating = 'Poor';
    } else {
      this.circularityRating = 'Very Poor';
    }
  }

  next();
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

const CalculateLCA = mongoose.model('CalculateLCA', CalculateLCASchema);

module.exports = CalculateLCA;
