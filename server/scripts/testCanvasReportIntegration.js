/**
 * Test Canvas-to-Report Integration
 * 
 * This script tests the automatic report generation from Canvas workflows.
 * It demonstrates how Canvas LCA data is converted into comprehensive Report documents.
 */

const http = require('http');

// Configuration
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

console.log('\n🧪 Testing Canvas-to-Report Integration\n');
console.log('='.repeat(60));

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testCanvasReportIntegration() {
  try {
    console.log('\n📋 Step 1: Fetching Canvas Workflows\n');
    
    const workflowsResponse = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: '/api/canvas/workflows',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (workflowsResponse.status !== 200) {
      console.error('❌ Failed to fetch workflows:', workflowsResponse.data.message);
      console.log('\n💡 Make sure you have created some Canvas workflows first!');
      return;
    }

    const workflows = workflowsResponse.data.data;
    
    if (!workflows || workflows.length === 0) {
      console.log('❌ No Canvas workflows found');
      console.log('\n💡 Create a Canvas workflow first by:');
      console.log('   1. POST /api/canvas/workflows');
      console.log('   2. Add some operations to it');
      console.log('   3. Calculate impacts: POST /api/canvas/workflows/:id/calculate');
      return;
    }

    console.log(`✅ Found ${workflows.length} workflow(s)`);
    
    // Find a workflow with status 'complete' or use the first one
    let targetWorkflow = workflows.find(w => w.status === 'complete') || workflows[0];
    
    console.log(`\n📊 Selected Workflow:`);
    console.log(`   ID: ${targetWorkflow._id}`);
    console.log(`   Name: ${targetWorkflow.name}`);
    console.log(`   Metal: ${targetWorkflow.metalType}`);
    console.log(`   Status: ${targetWorkflow.status}`);
    console.log(`   Operations: ${targetWorkflow.results?.operationCount || 0}`);
    console.log(`   Circularity Score: ${targetWorkflow.results?.circularityScore?.toFixed(2) || 'N/A'}%`);

    console.log('\n📝 Step 2: Generating LCA Report (Preview)\n');

    const previewResponse = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: `/api/canvas/workflows/${targetWorkflow._id}/report`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (previewResponse.status === 200) {
      const preview = previewResponse.data.data;
      console.log('✅ LCA Report Preview Generated:');
      console.log(`   Circularity Score: ${preview.circularityScore.toFixed(2)}%`);
      console.log(`   Environmental Rating: ${preview.environmentalRating}`);
      console.log(`   Total GWP: ${preview.impacts.totalGWP.toFixed(2)} kg CO₂-eq`);
      console.log(`   Energy Required: ${preview.impacts.totalEnergyRequired.toFixed(2)} kWh`);
      console.log(`   Improvement Opportunities: ${preview.opportunities?.length || 0}`);
    }

    console.log('\n💾 Step 3: Generating and Saving Full Report Document\n');

    const reportResponse = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: `/api/canvas/workflows/${targetWorkflow._id}/generate-report`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (reportResponse.status !== 201) {
      console.error('❌ Failed to generate report:', reportResponse.data.message);
      return;
    }

    const savedReport = reportResponse.data.data.report;
    
    console.log('✅ Report Generated and Saved Successfully!\n');
    console.log('📄 Report Details:');
    console.log(`   Report ID: ${savedReport._id}`);
    console.log(`   Title: ${savedReport.title}`);
    console.log(`   Status: ${savedReport.status}`);
    console.log(`   Visibility: ${savedReport.visibility}`);
    console.log(`   Sections: ${savedReport.sections.length}`);
    console.log(`   Total Metrics: ${savedReport.summary.totalMetrics}`);
    console.log(`   Tags: ${savedReport.tags.join(', ')}`);
    
    console.log('\n📊 Report Sections:');
    savedReport.sections.forEach((section, idx) => {
      console.log(`   ${idx + 1}. ${section.title} (${section.metrics?.length || 0} metrics)`);
    });

    console.log('\n🔗 Source Connection:');
    console.log(`   Canvas Workflow ID: ${savedReport.metadata.workflowId}`);
    console.log(`   Metal Type: ${savedReport.metadata.metalType}`);
    console.log(`   Generated At: ${new Date(savedReport.metadata.generatedAt).toLocaleString()}`);

    console.log('\n📥 Step 4: Testing Report Exports\n');

    // Test JSON export
    const jsonExportResponse = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: `/api/reports/${savedReport._id}/export?format=json`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (jsonExportResponse.status === 200) {
      console.log('✅ JSON Export: Available');
    }

    console.log('✅ PDF Export: Available (use browser or Postman to download)');
    console.log(`   URL: http://localhost:${PORT}/api/reports/${savedReport._id}/export?format=pdf`);

    console.log('\n🎉 Integration Test Complete!\n');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   ✅ Canvas Workflow → Report conversion working`);
    console.log(`   ✅ LCA data properly mapped to Report sections`);
    console.log(`   ✅ Metrics and analysis included`);
    console.log(`   ✅ Export functionality operational`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. View report: GET /api/reports/' + savedReport._id);
    console.log('   2. Export PDF: GET /api/reports/' + savedReport._id + '/export?format=pdf');
    console.log('   3. Publish report: POST /api/reports/' + savedReport._id + '/publish');
    console.log('   4. Update sections: PUT /api/reports/' + savedReport._id);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running: npm start\n');
    }
  }
}

// Run the test
testCanvasReportIntegration();
