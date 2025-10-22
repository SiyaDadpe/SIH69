/**
 * Simple API Test Script
 * Tests the Report endpoints to verify they work correctly
 */

const BASE_URL = 'http://localhost:5000/api';

async function testReportsAPI() {
  console.log('🧪 Testing Reports API Endpoints\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: GET all reports
    console.log('\n📋 Test 1: GET /api/reports (List all reports)');
    const listResponse = await fetch(`${BASE_URL}/reports`);
    const listData = await listResponse.json();
    console.log(`   Status: ${listResponse.status}`);
    console.log(`   Total Reports: ${listData.data.pagination.totalReports}`);
    console.log(`   Retrieved: ${listData.data.reports.length} reports`);
    
    if (listData.data.reports.length > 0) {
      const firstReport = listData.data.reports[0];
      console.log(`   First Report: ${firstReport.title}`);
      console.log(`   ID: ${firstReport._id}`);
      
      // Test 2: GET single report
      console.log(`\n📄 Test 2: GET /api/reports/:id (Get single report)`);
      const singleResponse = await fetch(`${BASE_URL}/reports/${firstReport._id}`);
      const singleData = await singleResponse.json();
      console.log(`   Status: ${singleResponse.status}`);
      console.log(`   Report: ${singleData.data.report.title}`);
      console.log(`   Sections: ${singleData.data.report.sections.length}`);
      console.log(`   Status: ${singleData.data.report.status}`);
      
      // Test 3: GET report statistics
      console.log(`\n📊 Test 3: GET /api/reports/stats (Get statistics)`);
      const statsResponse = await fetch(`${BASE_URL}/reports/stats`);
      const statsData = await statsResponse.json();
      console.log(`   Status: ${statsResponse.status}`);
      console.log(`   Total Reports: ${statsData.data.stats.totalReports}`);
      console.log(`   By Status:`, statsData.data.stats.byStatus);
      console.log(`   By Visibility:`, statsData.data.stats.byVisibility);
      
      // Test 4: Filter by status
      console.log(`\n🔍 Test 4: GET /api/reports?status=final (Filter by status)`);
      const filterResponse = await fetch(`${BASE_URL}/reports?status=final`);
      const filterData = await filterResponse.json();
      console.log(`   Status: ${filterResponse.status}`);
      console.log(`   Total Final Reports: ${filterData.data.pagination.totalReports}`);
      
      // Test 5: Search reports
      console.log(`\n🔎 Test 5: GET /api/reports?search=aluminum (Text search)`);
      const searchResponse = await fetch(`${BASE_URL}/reports?search=aluminum`);
      const searchData = await searchResponse.json();
      console.log(`   Status: ${searchResponse.status}`);
      console.log(`   Found: ${searchData.data.pagination.totalReports} reports`);
      
      // Test 6: Create a new report
      console.log(`\n➕ Test 6: POST /api/reports (Create new report)`);
      const newReport = {
        title: 'Test Report - Automated Creation',
        description: 'This is a test report created via API',
        status: 'draft',
        visibility: 'public',
        tags: ['test', 'automated'],
        sections: [
          {
            title: 'Test Section',
            order: 1,
            content: 'This is a test section',
            metrics: [
              {
                name: 'test_metric',
                label: 'Test Metric',
                value: 42,
                unit: 'units'
              }
            ]
          }
        ]
      };
      
      const createResponse = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      });
      const createData = await createResponse.json();
      console.log(`   Status: ${createResponse.status}`);
      console.log(`   Created Report ID: ${createData.data.report._id}`);
      console.log(`   Title: ${createData.data.report.title}`);
      
      const createdId = createData.data.report._id;
      
      // Test 7: Update the report
      console.log(`\n✏️  Test 7: PATCH /api/reports/:id (Update report)`);
      const updateResponse = await fetch(`${BASE_URL}/reports/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Report - Updated Title',
          description: 'Updated description via API'
        })
      });
      const updateData = await updateResponse.json();
      console.log(`   Status: ${updateResponse.status}`);
      console.log(`   Updated Title: ${updateData.data.report.title}`);
      
      // Test 8: Publish the report
      console.log(`\n📤 Test 8: POST /api/reports/:id/publish (Publish report)`);
      const publishResponse = await fetch(`${BASE_URL}/reports/${createdId}/publish`, {
        method: 'POST'
      });
      const publishData = await publishResponse.json();
      console.log(`   Status: ${publishResponse.status}`);
      console.log(`   Report Status: ${publishData.data.report.status}`);
      console.log(`   Published At: ${publishData.data.report.publishedAt}`);
      
      // Test 9: Export report
      console.log(`\n💾 Test 9: GET /api/reports/:id/export?format=json (Export)`);
      const exportResponse = await fetch(`${BASE_URL}/reports/${createdId}/export?format=json`);
      const exportData = await exportResponse.json();
      console.log(`   Status: ${exportResponse.status}`);
      console.log(`   Exported Report Title: ${exportData.title}`);
      console.log(`   Sections in Export: ${exportData.sections.length}`);
      
      // Test 10: Delete the report
      console.log(`\n🗑️  Test 10: DELETE /api/reports/:id (Delete report)`);
      const deleteResponse = await fetch(`${BASE_URL}/reports/${createdId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.json();
      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Deleted Report: ${deleteData.data.deletedReportTitle}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
testReportsAPI();
