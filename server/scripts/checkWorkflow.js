const mongoose = require('mongoose');
require('dotenv').config();

const WizardWorkflow = require('../src/models/WizardWorkflow');

async function checkWorkflow() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lca-platform';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check for specific workflow
    const workflowId = '690f3eb2efe55730f6ffe479';
    console.log(`\n🔍 Searching for workflow: ${workflowId}`);
    
    const workflow = await WizardWorkflow.findById(workflowId);
    
    if (workflow) {
      console.log('✅ Workflow found:');
      console.log(JSON.stringify(workflow, null, 2));
    } else {
      console.log('❌ Workflow not found');
      
      // List all workflows
      console.log('\n📋 Listing all wizard workflows:');
      const allWorkflows = await WizardWorkflow.find().select('_id name metalType status createdAt').limit(10);
      
      if (allWorkflows.length === 0) {
        console.log('  No workflows found in database');
      } else {
        allWorkflows.forEach(w => {
          console.log(`  - ${w._id} | ${w.name} | ${w.metalType} | ${w.status} | ${w.createdAt}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkWorkflow();
