/**
 * Test Mining Step Update
 * Manually tests the wizard step update endpoint
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
const WORKFLOW_ID = '690ec1c418d9e184d306e396';

// Sample mining data matching the form structure
const miningData = {
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

function testMiningStepUpdate() {
  console.log('='.repeat(80));
  console.log('TESTING MINING STEP UPDATE');
  console.log('='.repeat(80));
  console.log('\n📤 Sending data to:', `/api/wizard/workflows/${WORKFLOW_ID}/steps/mining`);
  console.log('\n📦 Data being sent:');
  console.log(JSON.stringify(miningData, null, 2));
  console.log('\n🔑 Data keys:', Object.keys(miningData));
  console.log('📊 Number of fields:', Object.keys(miningData).length);

  const postData = JSON.stringify(miningData);

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

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n' + '='.repeat(80));
      console.log('✅ SUCCESS! Response received:');
      console.log('='.repeat(80));
      console.log('\n📥 Response status:', res.statusCode);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('📥 Response message:', jsonData.message);
        
        if (jsonData.data?.workflow?.mining) {
          console.log('\n📦 Saved mining data:');
          console.log(JSON.stringify(jsonData.data.workflow.mining, null, 2));
          console.log('\n✅ Fields saved:', Object.keys(jsonData.data.workflow.mining).length);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n' + '='.repeat(80));
    console.error('❌ ERROR OCCURRED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
  });

  req.write(postData);
  req.end();
}

testMiningStepUpdate();
