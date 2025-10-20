/**
 * Canvas Workflow Model
 * 
 * Represents a saved LCA workflow/canvas configuration created by users.
 * Stores the sequence of operations, connections, and calculated results.
 * 
 * @module models/CanvasWorkflow
 */

const mongoose = require('mongoose');

/**
 * Canvas Workflow Schema
 * 
 * @typedef {Object} CanvasWorkflow
 * @property {string} name - Workflow name
 * @property {string} description - Workflow description
 * @property {ObjectId} userId - User who created workflow
 * @property {string} metalType - Primary metal being processed
 * @property {Array} stages - Array of stage data with operations
 * @property {Object} results - Calculated LCA results
 * @property {string} status - Workflow status
 * @property {boolean} isPublic - Whether workflow is shareable
 * @property {Date} createdAt - Creation timestamp
 */
const canvasWorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },

    metalType: {
      type: String,
      required: [true, 'Metal type is required'],
      enum: {
        values: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc'],
        message: '{VALUE} is not a valid metal type'
      },
      index: true
    },

    // Array storing operations in each stage
    stages: [
      {
        stageId: {
          type: String,
          required: true,
          enum: [
            'stage1-extraction',
            'stage2-processing',
            'stage3a-alumina-refining',
            'stage4-smelting',
            'stage5-manufacturing',
            'stage6-recycling',
            'stage7-valorization'
          ]
        },
        stageNumber: {
          type: Number,
          required: true
        },
        stageName: {
          type: String,
          required: true
        },
        operations: [
          {
            operationId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Operation',
              required: true
            },
            operationName: String,
            category: String,
            quantity: {
              type: Number,
              default: 1,
              min: [0.1, 'Quantity must be at least 0.1'],
              max: [1000, 'Quantity cannot exceed 1000']
            },
            unit: {
              type: String,
              default: 'tons',
              enum: ['tons', 'kg', 'units', 'batches']
            },
            // Impact at this operation
            impactData: {
              gwp: Number,
              waterUsage: Number,
              wasteGenerated: Number,
              energyRequired: Number,
              recoveryRate: Number
            },
            // Order within stage
            order: Number,
            _id: false
          }
        ],
        _id: false
      }
    ],

    // Calculated LCA results
    results: {
      totalGWP: {
        type: Number,
        default: 0
      },
      totalWaterUsage: {
        type: Number,
        default: 0
      },
      totalWasteGenerated: {
        type: Number,
        default: 0
      },
      totalEnergyRequired: {
        type: Number,
        default: 0
      },
      averageRecoveryRate: {
        type: Number,
        default: 0
      },
      circularityScore: {
        type: Number,
        default: 0,
        min: [0, 'Circularity cannot be negative'],
        max: [100, 'Circularity cannot exceed 100']
      },
      operationCount: {
        type: Number,
        default: 0
      },
      lastCalculated: Date,
      _id: false
    },

    // Workflow state
    status: {
      type: String,
      enum: ['draft', 'complete', 'archived'],
      default: 'draft'
    },

    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },

    // Tags for searching
    tags: [String],

    // Version control
    version: {
      type: Number,
      default: 1
    },

    // Parent workflow if this is a copy
    parentWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CanvasWorkflow',
      default: null
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
canvasWorkflowSchema.index({ userId: 1, createdAt: -1 });
canvasWorkflowSchema.index({ metalType: 1 });
canvasWorkflowSchema.index({ isPublic: 1, createdAt: -1 });
canvasWorkflowSchema.index({ status: 1 });

/**
 * Virtual Properties
 */
canvasWorkflowSchema.virtual('stageCount').get(function() {
  return this.stages.filter(s => s.operations.length > 0).length;
});

canvasWorkflowSchema.virtual('totalOperations').get(function() {
  return this.results.operationCount || 0;
});

canvasWorkflowSchema.virtual('isComplete').get(function() {
  return this.status === 'complete' && this.results.circularityScore > 0;
});

canvasWorkflowSchema.virtual('environmentalImpact').get(function() {
  if (this.results.circularityScore >= 80) return 'excellent';
  if (this.results.circularityScore >= 60) return 'good';
  if (this.results.circularityScore >= 40) return 'fair';
  return 'poor';
});

/**
 * Instance Methods
 */

canvasWorkflowSchema.methods.addOperation = function(stageId, operationId, operationName, quantity = 1, unit = 'tons') {
  let stage = this.stages.find(s => s.stageId === stageId);
  
  if (!stage) {
    throw new Error(`Stage ${stageId} not found in workflow`);
  }

  const operation = {
    operationId,
    operationName,
    quantity,
    unit,
    order: stage.operations.length
  };

  stage.operations.push(operation);
  return this;
};

canvasWorkflowSchema.methods.removeOperation = function(stageId, operationIndex) {
  const stage = this.stages.find(s => s.stageId === stageId);
  
  if (!stage || !stage.operations[operationIndex]) {
    throw new Error('Operation not found');
  }

  stage.operations.splice(operationIndex, 1);
  
  // Reorder remaining operations
  stage.operations.forEach((op, index) => {
    op.order = index;
  });

  return this;
};

canvasWorkflowSchema.methods.reorderOperations = function(stageId, newOrder) {
  const stage = this.stages.find(s => s.stageId === stageId);
  
  if (!stage) {
    throw new Error(`Stage ${stageId} not found`);
  }

  this.stages.find(s => s.stageId === stageId).operations = newOrder.map((op, index) => ({
    ...op,
    order: index
  }));

  return this;
};

canvasWorkflowSchema.methods.updateImpactData = function(stageId, operationIndex, impactData) {
  const stage = this.stages.find(s => s.stageId === stageId);
  
  if (!stage || !stage.operations[operationIndex]) {
    throw new Error('Operation not found');
  }

  stage.operations[operationIndex].impactData = impactData;
  return this;
};

canvasWorkflowSchema.methods.getAllOperations = function() {
  const allOps = [];
  this.stages.forEach(stage => {
    stage.operations.forEach(op => {
      allOps.push({
        ...op,
        stageId: stage.stageId,
        stageName: stage.stageName
      });
    });
  });
  return allOps;
};

/**
 * Static Methods
 */

canvasWorkflowSchema.statics.createEmpty = function(userId, metalType, name) {
  const stages = [
    { stageId: 'stage1-extraction', stageNumber: 1, stageName: 'Stage 1: Extraction' },
    { stageId: 'stage2-processing', stageNumber: 2, stageName: 'Stage 2: Processing' },
    { stageId: 'stage3a-alumina-refining', stageNumber: 3, stageName: 'Stage 3A: Alumina Refining' },
    { stageId: 'stage4-smelting', stageNumber: 4, stageName: 'Stage 4: Smelting' },
    { stageId: 'stage5-manufacturing', stageNumber: 5, stageName: 'Stage 5: Manufacturing' },
    { stageId: 'stage6-recycling', stageNumber: 6, stageName: 'Stage 6: Recycling' },
    { stageId: 'stage7-valorization', stageNumber: 7, stageName: 'Stage 7: Valorization' }
  ].map(s => ({ ...s, operations: [] }));

  return this.create({
    userId,
    metalType,
    name,
    stages,
    results: {
      totalGWP: 0,
      totalWaterUsage: 0,
      totalWasteGenerated: 0,
      totalEnergyRequired: 0,
      averageRecoveryRate: 0,
      circularityScore: 0,
      operationCount: 0
    }
  });
};

canvasWorkflowSchema.statics.getByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

/**
 * CanvasWorkflow Model
 * @type {mongoose.Model<CanvasWorkflow>}
 */
const CanvasWorkflow = mongoose.model('CanvasWorkflow', canvasWorkflowSchema);

module.exports = CanvasWorkflow;
