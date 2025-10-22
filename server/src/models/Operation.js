/**
 * Operation Model
 * 
 * Represents a single operation/process that can be used in the canvas workflow.
 * Each operation belongs to a specific stage and has environmental impact metrics.
 * 
 * @module models/Operation
 */

const mongoose = require('mongoose');

/**
 * Operation Schema
 * 
 * @typedef {Object} Operation
 * @property {string} name - Operation name
 * @property {string} description - Detailed description
 * @property {string} stage - Which LCA stage (1-7)
 * @property {string[]} metalTypes - Applicable metal types
 * @property {number} gwp - Global Warming Potential (kg CO2-eq per unit)
 * @property {number} waterUsage - Water consumption (liters per unit)
 * @property {number} wasteGenerated - Waste percentage
 * @property {number} energyRequired - Energy requirement (kWh per unit)
 * @property {number} recoveryRate - Material recovery percentage (0-100)
 * @property {string} category - Operation category/type
 * @property {Object} icon - Icon information for frontend
 * @property {boolean} isActive - Whether operation is available
 */
const operationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Operation name is required'],
      trim: true,
      unique: true
      // Index defined separately below
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },

    stage: {
      type: String,
      required: [true, 'Stage is required'],
      enum: {
        values: [
          'stage1-extraction',
          'stage2-processing',
          'stage3a-alumina-refining',
          'stage4-smelting',
          'stage5-manufacturing',
          'stage6-recycling',
          'stage7-valorization'
        ],
        message: '{VALUE} is not a valid stage'
      }
      // Index defined separately below
    },

    metalTypes: {
      type: [String],
      required: [true, 'Metal types are required'],
      enum: {
        values: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc', 'universal'],
        message: '{VALUE} is not a valid metal type'
      }
    },

    // Environmental impact metrics (per unit processed)
    gwp: {
      type: Number,
      required: [true, 'GWP is required'],
      min: [0, 'GWP cannot be negative'],
      default: 0
    },

    waterUsage: {
      type: Number,
      required: [true, 'Water usage is required'],
      min: [0, 'Water usage cannot be negative'],
      default: 0
    },

    wasteGenerated: {
      type: Number,
      required: [true, 'Waste generated percentage is required'],
      min: [0, 'Waste cannot be negative'],
      max: [100, 'Waste cannot exceed 100%'],
      default: 0
    },

    energyRequired: {
      type: Number,
      required: [true, 'Energy required is required'],
      min: [0, 'Energy cannot be negative'],
      default: 0
    },

    recoveryRate: {
      type: Number,
      required: [true, 'Recovery rate is required'],
      min: [0, 'Recovery rate cannot be negative'],
      max: [100, 'Recovery rate cannot exceed 100%'],
      default: 0
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
      // Index defined separately below
    },

    icon: {
      name: {
        type: String,
        default: 'Zap'
      },
      color: {
        type: String,
        default: '#3B82F6'
      }
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    parameters: {
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
operationSchema.index({ stage: 1, metalTypes: 1 });
operationSchema.index({ stage: 1, isActive: 1 });
operationSchema.index({ category: 1 });

/**
 * Virtual Properties
 */
operationSchema.virtual('impactScore').get(function() {
  return (this.gwp + (this.waterUsage / 100) + this.energyRequired) / 3;
});

operationSchema.virtual('sustainability').get(function() {
  return this.recoveryRate > 70 ? 'high' : this.recoveryRate > 40 ? 'medium' : 'low';
});

/**
 * Instance Methods
 */

operationSchema.methods.isApplicable = function(metalType) {
  return this.metalTypes.includes(metalType) || this.metalTypes.includes('universal');
};

operationSchema.methods.getImpactData = function() {
  return {
    gwp: this.gwp,
    waterUsage: this.waterUsage,
    wasteGenerated: this.wasteGenerated,
    energyRequired: this.energyRequired,
    recoveryRate: this.recoveryRate
  };
};

/**
 * Static Methods
 */

operationSchema.statics.getByStage = function(stage, metalType = null) {
  const query = { stage, isActive: true };
  if (metalType) {
    query.metalTypes = { $in: [metalType, 'universal'] };
  }
  return this.find(query).sort({ name: 1 });
};

operationSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

operationSchema.statics.getAllByMetal = function(metalType) {
  return this.find({
    metalTypes: { $in: [metalType, 'universal'] },
    isActive: true
  }).sort({ stage: 1 });
};

/**
 * Operation Model
 * @type {mongoose.Model<Operation>}
 */
const Operation = mongoose.model('Operation', operationSchema);

module.exports = Operation;
