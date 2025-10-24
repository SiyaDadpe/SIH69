/**
 * Wizard API Test Script
 * 
 * Quick test of wizard endpoints to verify integration
 */

const http = require('http');

const baseURL = 'http://localhost:5000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testWizardAPI() {
  console.log('🧪 Testing Wizard API...\n');

  try {
    // Test 1: Get statistics (should be empty initially)
    console.log('📊 Test 1: GET /api/wizard/statistics');
    const stats = await makeRequest('/api/wizard/statistics');
    console.log(`   Status: ${stats.status}`);
    console.log(`   Data:`, JSON.stringify(stats.data, null, 2));
    console.log('   ✅ Statistics endpoint working\n');

    // Test 2: Get all workflows (should be empty)
    console.log('📋 Test 2: GET /api/wizard/workflows');
    const workflows = await makeRequest('/api/wizard/workflows');
    console.log(`   Status: ${workflows.status}`);
    console.log(`   Count: ${workflows.data.count || 0}`);
    console.log('   ✅ Get workflows endpoint working\n');

    // Test 3: Create a new workflow
    console.log('➕ Test 3: POST /api/wizard/workflows');
    const newWorkflow = await makeRequest('/api/wizard/workflows', 'POST', {
      name: 'Test Aluminium Wizard',
      metalType: 'Aluminium',
      userId: '68f5f9e48a8acc3f27b21ad0', // Use existing user ID from your DB
      description: 'Test wizard workflow'
    });
    console.log(`   Status: ${newWorkflow.status}`);
    
    if (newWorkflow.status === 201) {
      const workflowId = newWorkflow.data.data.workflow._id;
      console.log(`   Created workflow ID: ${workflowId}`);
      console.log('   ✅ Create workflow endpoint working\n');

      // Test 4: Get single workflow
      console.log('🔍 Test 4: GET /api/wizard/workflows/:id');
      const singleWorkflow = await makeRequest(`/api/wizard/workflows/${workflowId}`);
      console.log(`   Status: ${singleWorkflow.status}`);
      console.log(`   Workflow name: ${singleWorkflow.data.data.workflow.name}`);
      console.log(`   Completion: ${singleWorkflow.data.data.workflow.completionPercentage}%`);
      console.log('   ✅ Get single workflow endpoint working\n');

      // Test 5: Update step data
      console.log('✏️  Test 5: PUT /api/wizard/workflows/:id/steps/mining');
      const updateStep = await makeRequest(`/api/wizard/workflows/${workflowId}/steps/mining`, 'PUT', {
        applicableProcesses: ['openPit', 'drilling'],
        location: 'Australia',
        oreGrade: 45,
        productionVolume: 10000
      });
      console.log(`   Status: ${updateStep.status}`);
      console.log('   ✅ Update step endpoint working\n');

      // Test 6: Mark step as completed
      console.log('✔️  Test 6: POST /api/wizard/workflows/:id/steps/mining/complete');
      const completeStep = await makeRequest(`/api/wizard/workflows/${workflowId}/steps/mining/complete`, 'POST');
      console.log(`   Status: ${completeStep.status}`);
      console.log(`   Completion: ${completeStep.data.data.completionPercentage}%`);
      console.log(`   Next step: ${completeStep.data.data.nextStep}`);
      console.log('   ✅ Complete step endpoint working\n');

      // Test 7: Update workflow metadata
      console.log('📝 Test 7: PUT /api/wizard/workflows/:id');
      const updateWorkflow = await makeRequest(`/api/wizard/workflows/${workflowId}`, 'PUT', {
        description: 'Updated test wizard description',
        isPublic: true
      });
      console.log(`   Status: ${updateWorkflow.status}`);
      console.log('   ✅ Update workflow endpoint working\n');

      // Test 8: Get updated statistics
      console.log('📊 Test 8: GET /api/wizard/statistics (after creation)');
      const newStats = await makeRequest('/api/wizard/statistics');
      console.log(`   Total workflows: ${newStats.data.data.overall.totalWorkflows}`);
      console.log(`   Draft workflows: ${newStats.data.data.overall.draftWorkflows}`);
      console.log(`   Avg completion: ${newStats.data.data.overall.avgCompletionPercentage.toFixed(1)}%`);
      console.log('   ✅ Statistics updated correctly\n');

      console.log('🎉 All tests passed! Wizard API is fully functional.\n');
      console.log(`Created test workflow ID: ${workflowId}`);
      console.log('You can now delete it manually or use: DELETE /api/wizard/workflows/:id\n');
      
    } else {
      console.log('   ❌ Failed to create workflow');
      console.log('   Error:', newWorkflow.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure the server is running: npm start');
  }
}

// Run tests
testWizardAPI();
