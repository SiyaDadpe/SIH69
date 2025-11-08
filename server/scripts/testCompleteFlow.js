/**
 * Complete Wizard Flow Test
 * Tests the entire data flow from form submission to database storage
 */

const http = require('http');
require('dotenv').config();
const mongoose = require('mongoose');
const { WizardWorkflow } = require('../src/models');

const WORKFLOW_ID = '690ec1c418d9e184d306e396';

// Sample data that matches what the frontend would send
const testData = {
  applicableProcesses: ['openPit', 'drilling'],
  location: 'Jharkhand',
  year: 2025,
  oreGrade: 38,
  overburdenRatio: 450,
  typeOfEquipment: 'diesel',
  waterUsage: 250,
  biodiversityImpact: 'moderate',
  productionVolume: 1000,
  fuelConsumption: 50,
  waterSource: 'Groundwater',
  blastingFrequency: 'Weekly',
  explosivesUsed: 100,
  redMudGeneration: 50,
  landReclamation: 'Planned',
  dustControl: 'Water spraying',
  noiseLevel: 85,
  transport: {
    distance: 50,
    mode: 'Road',
    vehicleType: 'Diesel trucks'
  }
};

async function testCompleteFlow() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 COMPLETE WIZARD FLOW TEST');
  console.log('='.repeat(100));

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅ Connected to MongoDB');

    // Step 1: Get current state
    console.log('\n' + '─'.repeat(100));
    console.log('📊 STEP 1: Current Database State');
    console.log('─'.repeat(100));
    
    let workflow = await WizardWorkflow.findById(WORKFLOW_ID).lean();
    if (!workflow) {
      console.log('❌ Workflow not found!');
      process.exit(1);
    }
    
    console.log('Current mining data fields:', Object.keys(workflow.mining || {}).length);
    console.log('Current data:', JSON.stringify(workflow.mining, null, 2));

    // Step 2: Send update request
    console.log('\n' + '─'.repeat(100));
    console.log('📤 STEP 2: Sending PUT Request to Backend');
    console.log('─'.repeat(100));
    console.log('Endpoint: PUT /api/wizard/workflows/' + WORKFLOW_ID + '/steps/mining');
    console.log('Data fields:', Object.keys(testData).length);
    console.log('Data preview:', JSON.stringify(testData, null, 2).substring(0, 300) + '...');

    const postData = JSON.stringify(testData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/wizard/workflows/${WORKFLOW_ID}/steps/mining`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiResponse = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('\n✅ API Response Status:', apiResponse.status);
    if (apiResponse.status === 200) {
      console.log('✅ API Response Success:', apiResponse.data.success);
      console.log('✅ API Message:', apiResponse.data.message);
    } else {
      console.log('❌ API Error:', apiResponse.data);
      process.exit(1);
    }

    // Step 3: Verify in database
    console.log('\n' + '─'.repeat(100));
    console.log('🔍 STEP 3: Verifying Database Update');
    console.log('─'.repeat(100));
    
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    workflow = await WizardWorkflow.findById(WORKFLOW_ID).lean();
    
    console.log('\nUpdated mining data:');
    console.log(JSON.stringify(workflow.mining, null, 2));
    
    const savedFields = Object.keys(workflow.mining || {}).filter(k => {
      const val = workflow.mining[k];
      return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
    });
    
    console.log('\n📊 Fields with data:', savedFields.length);
    console.log('📋 Fields:', savedFields.join(', '));

    // Step 4: Verification
    console.log('\n' + '─'.repeat(100));
    console.log('✅ STEP 4: Verification');
    console.log('─'.repeat(100));
    
    const expectedFields = Object.keys(testData);
    const missingFields = expectedFields.filter(f => !workflow.mining[f]);
    
    if (missingFields.length === 0) {
      console.log('\n🎉 SUCCESS! All fields saved correctly!');
      console.log('✅ Sent:', expectedFields.length, 'fields');
      console.log('✅ Saved:', savedFields.length, 'fields');
    } else {
      console.log('\n⚠️  WARNING: Some fields missing');
      console.log('❌ Missing:', missingFields.join(', '));
    }

    // Step 5: Test with actual form validation
    console.log('\n' + '─'.repeat(100));
    console.log('🔬 STEP 5: Testing Form Validation Requirements');
    console.log('─'.repeat(100));
    
    const criticalFields = ['applicableProcesses', 'location', 'typeOfEquipment', 'biodiversityImpact'];
    const hasCriticalFields = criticalFields.every(f => workflow.mining[f] && 
      (Array.isArray(workflow.mining[f]) ? workflow.mining[f].length > 0 : true));
    
    if (hasCriticalFields) {
      console.log('✅ All critical fields present and valid');
      criticalFields.forEach(f => {
        console.log(`   ✅ ${f}:`, workflow.mining[f]);
      });
    } else {
      console.log('❌ Some critical fields missing or empty');
    }

    console.log('\n' + '='.repeat(100));
    console.log('🏁 TEST COMPLETED');
    console.log('='.repeat(100));
    console.log('\n📋 Summary:');
    console.log('   • Workflow ID:', WORKFLOW_ID);
    console.log('   • Fields sent:', expectedFields.length);
    console.log('   • Fields saved:', savedFields.length);
    console.log('   • Success rate:', Math.round((savedFields.length / expectedFields.length) * 100) + '%');
    console.log('   • Status:', workflow.status);
    console.log('   • Completed steps:', workflow.completedSteps || []);
    console.log('\n');

  } catch (error) {
    console.error('\n' + '='.repeat(100));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(100));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

testCompleteFlow();
