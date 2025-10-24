require('dotenv').config();
const mongoose = require('mongoose');
const WizardWorkflow = require('../src/models/WizardWorkflow');

async function checkLatestWizard() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');
    
    const wizard = await WizardWorkflow.findOne().sort({createdAt: -1});
    
    if (!wizard) {
      console.log('No wizards found');
      return;
    }
    
    console.log('=== LATEST WIZARD WORKFLOW ===\n');
    console.log('Name:', wizard.name);
    console.log('Metal:', wizard.metalType);
    console.log('Status:', wizard.status);
    console.log('Completion:', wizard.completionPercentage + '%');
    console.log('Completed Steps:', wizard.completedSteps);
    console.log('\n--- STEP DATA ---');
    console.log('Mining:', wizard.mining ? 'Has Data' : 'Empty');
    console.log('Beneficiation:', wizard.beneficiation ? 'Has Data' : 'Empty');
    console.log('Refining:', wizard.refining ? 'Has Data' : 'Empty');
    console.log('Smelting:', wizard.smelting ? 'Has Data' : 'Empty');
    console.log('Manufacturing:', wizard.manufacturing ? 'Has Data' : 'Empty');
    console.log('Recycling:', wizard.recycling ? 'Has Data' : 'Empty');
    console.log('Valorization:', wizard.valorization ? 'Has Data' : 'Empty');
    
    console.log('\n--- MINING DATA (if any) ---');
    if (wizard.mining) {
      console.log(JSON.stringify(wizard.mining, null, 2));
    } else {
      console.log('No mining data');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLatestWizard();
