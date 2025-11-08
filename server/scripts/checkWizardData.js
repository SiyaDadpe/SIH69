/**
 * Check Wizard Workflow Data
 * Displays the complete nested data structure for a wizard workflow
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { WizardWorkflow } = require('../src/models');

async function checkWizardData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the latest wizard workflow
    const workflow = await WizardWorkflow.findById('690ec1c418d9e184d306e396')
      .populate('userId', 'name email')
      .lean();

    if (!workflow) {
      console.log('❌ Workflow not found with ID: 690ec1c418d9e184d306e396');
      console.log('\nFetching latest workflow instead...\n');
      
      const latestWorkflow = await WizardWorkflow.findOne()
        .sort('-createdAt')
        .populate('userId', 'name email')
        .lean();
      
      if (!latestWorkflow) {
        console.log('❌ No workflows found in database');
        process.exit(0);
      }
      
      displayWorkflowData(latestWorkflow);
    } else {
      displayWorkflowData(workflow);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

function displayWorkflowData(workflow) {
  console.log('='.repeat(80));
  console.log('WORKFLOW DATA ANALYSIS');
  console.log('='.repeat(80));
  console.log(`\nID: ${workflow._id}`);
  console.log(`Name: ${workflow.name}`);
  console.log(`Metal Type: ${workflow.metalType}`);
  console.log(`Status: ${workflow.status}`);
  console.log(`User: ${workflow.userId?.name} (${workflow.userId?.email})`);
  console.log(`Completed Steps: [${workflow.completedSteps.join(', ')}]`);
  console.log(`Current Step: ${workflow.currentStep}`);

  console.log('\n' + '='.repeat(80));
  console.log('STEP 0: MINING DATA');
  console.log('='.repeat(80));
  if (workflow.mining && Object.keys(workflow.mining).length > 0) {
    console.log(JSON.stringify(workflow.mining, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.mining).filter(k => workflow.mining[k] !== undefined && workflow.mining[k] !== null && workflow.mining[k] !== '').length}`);
  } else {
    console.log('❌ No mining data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 1: BENEFICIATION DATA');
  console.log('='.repeat(80));
  if (workflow.beneficiation && Object.keys(workflow.beneficiation).length > 0) {
    console.log(JSON.stringify(workflow.beneficiation, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.beneficiation).filter(k => workflow.beneficiation[k] !== undefined && workflow.beneficiation[k] !== null && workflow.beneficiation[k] !== '').length}`);
  } else {
    console.log('❌ No beneficiation data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 2: REFINING DATA');
  console.log('='.repeat(80));
  if (workflow.refining && Object.keys(workflow.refining).length > 0) {
    console.log(JSON.stringify(workflow.refining, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.refining).filter(k => workflow.refining[k] !== undefined && workflow.refining[k] !== null && workflow.refining[k] !== '').length}`);
  } else {
    console.log('❌ No refining data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 3: SMELTING DATA');
  console.log('='.repeat(80));
  if (workflow.smelting && Object.keys(workflow.smelting).length > 0) {
    console.log(JSON.stringify(workflow.smelting, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.smelting).filter(k => workflow.smelting[k] !== undefined && workflow.smelting[k] !== null && workflow.smelting[k] !== '').length}`);
  } else {
    console.log('❌ No smelting data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 4: MANUFACTURING DATA');
  console.log('='.repeat(80));
  if (workflow.manufacturing && Object.keys(workflow.manufacturing).length > 0) {
    console.log(JSON.stringify(workflow.manufacturing, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.manufacturing).filter(k => workflow.manufacturing[k] !== undefined && workflow.manufacturing[k] !== null && workflow.manufacturing[k] !== '').length}`);
  } else {
    console.log('❌ No manufacturing data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 5: RECYCLING DATA');
  console.log('='.repeat(80));
  if (workflow.recycling && Object.keys(workflow.recycling).length > 0) {
    console.log(JSON.stringify(workflow.recycling, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.recycling).filter(k => workflow.recycling[k] !== undefined && workflow.recycling[k] !== null && workflow.recycling[k] !== '').length}`);
  } else {
    console.log('❌ No recycling data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('STEP 6: VALORIZATION DATA');
  console.log('='.repeat(80));
  if (workflow.valorization && Object.keys(workflow.valorization).length > 0) {
    console.log(JSON.stringify(workflow.valorization, null, 2));
    console.log(`\n📊 Fields populated: ${Object.keys(workflow.valorization).filter(k => workflow.valorization[k] !== undefined && workflow.valorization[k] !== null && workflow.valorization[k] !== '').length}`);
  } else {
    console.log('❌ No valorization data found (empty object)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('CALCULATED RESULTS');
  console.log('='.repeat(80));
  if (workflow.calculatedResults) {
    console.log(JSON.stringify(workflow.calculatedResults, null, 2));
  } else {
    console.log('❌ No calculated results yet');
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  const steps = ['mining', 'beneficiation', 'refining', 'smelting', 'manufacturing', 'recycling', 'valorization'];
  steps.forEach((step, index) => {
    const stepData = workflow[step];
    const hasData = stepData && Object.keys(stepData).length > 0;
    const fieldCount = hasData ? Object.keys(stepData).filter(k => stepData[k] !== undefined && stepData[k] !== null && stepData[k] !== '').length : 0;
    const isComplete = workflow.completedSteps.includes(index);
    console.log(`Step ${index} (${step}): ${hasData ? '✅ Has data' : '❌ Empty'} | ${fieldCount} fields | ${isComplete ? '✅ Marked complete' : '⏸️  Not complete'}`);
  });
}

checkWizardData();
