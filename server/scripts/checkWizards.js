require('dotenv').config();
const mongoose = require('mongoose');
const WizardWorkflow = require('../src/models/WizardWorkflow');

async function checkWizards() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const wizards = await WizardWorkflow.find().sort({createdAt: -1});
    console.log('\n=== TOTAL WIZARD WORKFLOWS:', wizards.length, '===\n');
    
    wizards.forEach((w, index) => {
      console.log(`${index + 1}. ${w.name}`);
      console.log(`   Metal: ${w.metalType}`);
      console.log(`   Status: ${w.status}`);
      console.log(`   Completion: ${w.completionPercentage}%`);
      console.log(`   Completed Steps: [${w.completedSteps.join(', ')}]`);
      console.log(`   Created: ${w.createdAt}`);
      console.log(`   Updated: ${w.updatedAt}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWizards();
