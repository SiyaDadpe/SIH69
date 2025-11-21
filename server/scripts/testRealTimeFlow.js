/**
 * Real-time Test - Monitor wizard data flow
 * Run this to see if data is reaching the backend
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { WizardWorkflow } = require('../src/models');

let lastKnownData = null;

async function monitorWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('👀 Monitoring workflow: 690ec1c418d9e184d306e396');
    console.log('📝 Watching for changes every 2 seconds...\n');

    // Monitor every 2 seconds
    setInterval(async () => {
      const workflow = await WizardWorkflow.findById('690ec1c418d9e184d306e396').lean();
      
      if (!workflow) {
        console.log('❌ Workflow not found');
        return;
      }

      const currentData = JSON.stringify(workflow.mining);
      
      if (currentData !== lastKnownData) {
        console.log('\n' + '='.repeat(80));
        console.log('🔄 CHANGE DETECTED!', new Date().toLocaleTimeString());
        console.log('='.repeat(80));
        console.log('Mining Data:');
        console.log(JSON.stringify(workflow.mining, null, 2));
        console.log('\n✅ Fields populated:', Object.keys(workflow.mining || {}).filter(k => {
          const val = workflow.mining[k];
          return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
        }).length);
        console.log('='.repeat(80) + '\n');
        lastKnownData = currentData;
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

monitorWorkflow();

// Keep process running
process.on('SIGINT', async () => {
  console.log('\n👋 Stopping monitor...');
  await mongoose.disconnect();
  process.exit(0);
});
