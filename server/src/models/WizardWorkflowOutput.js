/**
 * Wizard Workflow Output Model
 * 
 * Stores the COMBINED data: user-provided inputs + AI-predicted values
 * This model stores the enriched workflow data after AI prediction has filled in empty fields
 * 
 * @module models/WizardWorkflowOutput
 */

const mongoose = require('mongoose');

/**
 * Wizard Workflow Output Schema
 * 
 * Similar structure to WizardWorkflow but stores combined user + AI predicted data
 */
const wizardWorkflowOutputSchema = new mongoose.Schema(
  {
    // Reference to the original wizard workflow (user-only data)
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WizardWorkflow',
      required: true,
      index: true
    },

    // Reference to the user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Basic Information (copied from WizardWorkflow)
    name: {
      type: String,
      required: true,
      trim: true
    },

    metalType: {
      type: String,
      required: true,
      enum: ['Aluminium', 'Copper', 'Steel', 'Titanium', 'Lithium', 'Nickel', 'Gold', 'Zinc']
    },

    // Prediction metadata
    predictionMetadata: {
      generatedAt: {
        type: Date,
        default: Date.now
      },
      stepsWithPredictions: [{
        stepName: String,
        predictedFields: [String],
        confidence: Number
      }]
    },

    // Combined data for all 7 steps (user input + AI predictions)
    // Flexible schema to store any field combination
    mining: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    beneficiation: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    refining: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    smelting: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    manufacturing: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    recycling: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    valorization: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Overall completion status
    status: {
      type: String,
      enum: ['draft', 'predicted', 'completed'],
      default: 'draft'
    }
  },
  {
    timestamps: true,
    collection: 'wizardworkflowoutputs'
  }
);

// Indexes for performance
wizardWorkflowOutputSchema.index({ workflowId: 1, userId: 1 });
wizardWorkflowOutputSchema.index({ userId: 1, createdAt: -1 });
wizardWorkflowOutputSchema.index({ metalType: 1 });

// Static method to create or update output for a workflow
wizardWorkflowOutputSchema.statics.createOrUpdate = async function(workflowId, userId, stepName, combinedData, predictionInfo) {
  const existingOutput = await this.findOne({ workflowId });
  
  if (existingOutput) {
    // Update existing output
    existingOutput[stepName] = combinedData;
    
    // Update prediction metadata
    const existingStepMeta = existingOutput.predictionMetadata.stepsWithPredictions.find(
      s => s.stepName === stepName
    );
    
    if (existingStepMeta) {
      existingStepMeta.predictedFields = predictionInfo.predictedFields;
      existingStepMeta.confidence = predictionInfo.confidence;
    } else {
      existingOutput.predictionMetadata.stepsWithPredictions.push({
        stepName,
        predictedFields: predictionInfo.predictedFields,
        confidence: predictionInfo.confidence
      });
    }
    
    existingOutput.predictionMetadata.generatedAt = new Date();
    existingOutput.status = 'predicted';
    
    return await existingOutput.save();
  } else {
    // Create new output document
    const newOutput = await this.create({
      workflowId,
      userId,
      name: predictionInfo.workflowName || 'AI Predicted Workflow',
      metalType: predictionInfo.metalType || 'Aluminium',
      [stepName]: combinedData,
      predictionMetadata: {
        stepsWithPredictions: [{
          stepName,
          predictedFields: predictionInfo.predictedFields,
          confidence: predictionInfo.confidence
        }]
      },
      status: 'predicted'
    });
    
    return newOutput;
  }
};

// Instance method to get all predicted fields
wizardWorkflowOutputSchema.methods.getAllPredictedFields = function() {
  const allPredictedFields = {};
  
  this.predictionMetadata.stepsWithPredictions.forEach(step => {
    allPredictedFields[step.stepName] = step.predictedFields;
  });
  
  return allPredictedFields;
};

const WizardWorkflowOutput = mongoose.model('WizardWorkflowOutput', wizardWorkflowOutputSchema);

module.exports = WizardWorkflowOutput;
