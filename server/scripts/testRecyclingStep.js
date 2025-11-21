require('dotenv').config();
const mongoose = require('mongoose');
const WizardWorkflow = require('../src/models/WizardWorkflow');

async function testRecyclingStep() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');
    
    // Get the latest wizard
    const wizard = await WizardWorkflow.findOne().sort({createdAt: -1});
    
    if (!wizard) {
      console.log('No wizards found');
      return;
    }
    
    console.log('=== TESTING RECYCLING STEP ===\n');
    console.log('Workflow ID:', wizard._id);
    console.log('Current completion:', wizard.completionPercentage + '%');
    console.log('Completed steps:', wizard.completedSteps);
    console.log('\n--- Recycling Data ---');
    console.log(JSON.stringify(wizard.recycling, null, 2));
    
    // Try to mark recycling as complete
    console.log('\n--- Attempting to mark recycling complete ---');
    try {
      await wizard.markStepCompleted(5); // recycling = step 5
      console.log('✅ Recycling marked complete!');
      console.log('New completion:', wizard.completionPercentage + '%');
      console.log('Completed steps:', wizard.completedSteps);
    } catch (error) {
      console.error('❌ Error marking recycling complete:', error.message);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRecyclingStep();
