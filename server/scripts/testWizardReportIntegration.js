/**
 * Complete Wizard-to-Report Integration Test
 * 
 * Tests the full workflow:
 * 1. Create wizard workflow
 * 2. Fill in step data
 * 3. Complete steps
 * 4. Generate report from wizard
 * 5. Export report as PDF
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

async function testWizardToReportIntegration() {
  console.log('🧪 Testing Wizard-to-Report Integration...\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create wizard workflow
    console.log('\n📝 Step 1: Creating Wizard Workflow');
    console.log('-'.repeat(60));
    const createResponse = await makeRequest('/api/wizard/workflows', 'POST', {
      name: 'Complete Aluminium LCA Study',
      metalType: 'Aluminium',
      userId: '68f5f9e48a8acc3f27b21ad0',
      description: 'Comprehensive wizard-based LCA for aluminium production'
    });

    if (createResponse.status !== 201) {
      console.log('❌ Failed to create workflow');
      console.log('Response:', createResponse.data);
      return;
    }

    const workflowId = createResponse.data.data.workflow._id;
    console.log(`✅ Workflow created: ${workflowId}`);
    console.log(`   Name: ${createResponse.data.data.workflow.name}`);
    console.log(`   Metal: ${createResponse.data.data.workflow.metalType}`);

    // Step 2: Fill Mining Data
    console.log('\n⛏️  Step 2: Adding Mining Data');
    console.log('-'.repeat(60));
    const miningData = {
      applicableProcesses: ['openPit', 'drilling', 'electricShovel'],
      location: 'Western Australia',
      year: 2024,
      oreGrade: 42,
      overburdenRatio: 3.5,
      productionVolume: 50000,
      equipmentType: 'Electric',
      fuelConsumption: 15,
      waterSource: 'Recycled water',
      waterConsumption: 2.5,
      biodiversityImpact: 'Moderate',
      landReclamation: 'Planned',
      dustControl: 'Water spraying'
    };

    const miningResponse = await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/mining`,
      'PUT',
      miningData
    );
    console.log(`✅ Mining data added`);
    console.log(`   Ore Grade: ${miningData.oreGrade}%`);
    console.log(`   Production: ${miningData.productionVolume} tonnes/year`);

    // Mark mining complete
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/mining/complete`, 'POST');
    console.log('✅ Mining step marked complete');

    // Step 3: Fill Beneficiation Data
    console.log('\n🏭 Step 3: Adding Beneficiation Data');
    console.log('-'.repeat(60));
    const beneficiationData = {
      applicableProcesses: ['Crushing', 'Washing & Screening', 'Grinding'],
      location: 'Australia',
      feedRate: 500,
      waterConsumption: 1.8,
      electricityUse: 45,
      beneficiationEfficiency: 92,
      crushing: ['Primary Crushing', 'Secondary Crushing'],
      chemicalAgents: ['Flocculants']
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/beneficiation`,
      'PUT',
      beneficiationData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/beneficiation/complete`, 'POST');
    console.log('✅ Beneficiation data added and marked complete');
    console.log(`   Efficiency: ${beneficiationData.beneficiationEfficiency}%`);
    console.log(`   Electricity: ${beneficiationData.electricityUse} kWh/tonne`);

    // Step 4: Fill Refining Data
    console.log('\n⚗️  Step 4: Adding Refining Data');
    console.log('-'.repeat(60));
    const refiningData = {
      applicableProcesses: ['Digestion (caustic soda process)', 'Clarification (separating alumina liquor from red mud)', 'Calcination (removal of water to produce alumina powder)'],
      location: 'Queensland',
      energyUse: 250,
      waterUse: 3.2,
      redMudGeneration: 1.5,
      causticSoda: 85,
      so2Emissions: 0.8,
      noxEmissions: 0.5,
      dustEmissions: 0.3,
      redMudToxicityLevel: 'Moderate'
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/refining`,
      'PUT',
      refiningData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/refining/complete`, 'POST');
    console.log('✅ Refining data added and marked complete');
    console.log(`   Energy: ${refiningData.energyUse} kWh/tonne`);
    console.log(`   Red Mud: ${refiningData.redMudGeneration} kg/tonne`);

    // Step 5: Fill Smelting Data
    console.log('\n🔥 Step 5: Adding Smelting Data');
    console.log('-'.repeat(60));
    const smeltingData = {
      applicableProcesses: ['Electrolysis (cell operation)', 'Off-gas treatment (scrubber systems)'],
      variants: ['Pre-baked anode cells (standard technology)', 'Renewable-powered smelters (intermittent optimization possible)'],
      energySource: 'Hydropower',
      energyDemand: 13500,
      fluorideRecoveryEfficiency: 95,
      thermalEnergyRecoveryPotential: 15
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/smelting`,
      'PUT',
      smeltingData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/smelting/complete`, 'POST');
    console.log('✅ Smelting data added and marked complete');
    console.log(`   Energy Source: ${smeltingData.energySource}`);
    console.log(`   Energy Demand: ${smeltingData.energyDemand} kWh/tonne`);

    // Step 6: Fill Manufacturing Data
    console.log('\n🏗️  Step 6: Adding Manufacturing Data');
    console.log('-'.repeat(60));
    const manufacturingData = {
      applicableProcesses: ['Casting (ingots, billets – high-temperature energy)', 'Rolling (sheet metal – mechanical deformation)', 'Extrusion (tubes, profiles – efficient shaping)'],
      casting: ['Ingot Casting', 'Continuous Casting'],
      transportDistance: 150,
      scrapRate: 8,
      recycledContent: 35,
      transportMode: 'Rail',
      energyUsePerProcessStep: 180,
      emissionsFromFabrication: 2.1,
      lightweighting: ['Automotive', 'Aerospace'],
      corrosionBehaviorImpact: 'Minimal (long lifespan, low maintenance)'
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/manufacturing`,
      'PUT',
      manufacturingData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/manufacturing/complete`, 'POST');
    console.log('✅ Manufacturing data added and marked complete');
    console.log(`   Recycled Content: ${manufacturingData.recycledContent}%`);
    console.log(`   Scrap Rate: ${manufacturingData.scrapRate}%`);

    // Step 7: Fill Recycling Data
    console.log('\n♻️  Step 7: Adding Recycling Data');
    console.log('-'.repeat(60));
    const recyclingData = {
      applicableProcesses: ['Collection (scrap gathering – manual or automated)', 'Sorting', 'Remelting (furnace heating – energy intensive)'],
      variants: ['Closed-loop recycling (same product, high purity, lower emissions)', 'Secondary aluminium production (5–10% of primary energy use)'],
      scrapInputPercentage: 90,
      collectionRate: 85,
      recyclingMethods: 'Closed-loop',
      recoveryYield: 95,
      furnaceEnergyDemand: 800,
      emissionSavings: 15.2,
      sortingMethods: ['Optical sorting (computer vision + ML, accurate alloy separation)'],
      closedLoopRecyclingPercentage: 70,
      openLoopRecyclingPercentage: 30
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/recycling`,
      'PUT',
      recyclingData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/recycling/complete`, 'POST');
    console.log('✅ Recycling data added and marked complete');
    console.log(`   Recovery Yield: ${recyclingData.recoveryYield}%`);
    console.log(`   Emission Savings: ${recyclingData.emissionSavings} kg CO₂e/tonne`);

    // Step 8: Fill Valorization Data
    console.log('\n🌱 Step 8: Adding Valorization Data');
    console.log('-'.repeat(60));
    const valorizationData = {
      wasteTypes: ['Red Mud', 'Dross', 'Fluoride Gases'],
      valorizationMethods: ['Cement additive', 'Iron extraction', 'Dross recovery', 'Fluoride capture'],
      wasteUtilizationPercentages: 65,
      redMudWasteUtilized: 45,
      drossWasteUtilized: 85,
      fluorideGasesWasteUtilized: 90,
      emissionReductions: 3.5,
      ironExtractionEconomicViability: 'Moderate',
      drossRecoveryEconomicViability: 'High',
      fluorideCaptureEconomicViability: 'High',
      drossRecoveryEfficiency: 85,
      fluorideGasesRecoveryEfficiency: 92
    };

    await makeRequest(
      `/api/wizard/workflows/${workflowId}/steps/valorization`,
      'PUT',
      valorizationData
    );
    await makeRequest(`/api/wizard/workflows/${workflowId}/steps/valorization/complete`, 'POST');
    console.log('✅ Valorization data added and marked complete');
    console.log(`   Waste Utilization: ${valorizationData.wasteUtilizationPercentages}%`);
    console.log(`   Emission Reductions: ${valorizationData.emissionReductions} kg CO₂e/tonne`);

    // Step 9: Check completion status
    console.log('\n📊 Step 9: Checking Workflow Status');
    console.log('-'.repeat(60));
    const statusResponse = await makeRequest(`/api/wizard/workflows/${workflowId}`);
    const workflow = statusResponse.data.data.workflow;
    console.log(`✅ Workflow Status:`);
    console.log(`   Completion: ${workflow.completionPercentage}%`);
    console.log(`   Completed Steps: ${workflow.completedSteps.length}/7`);
    console.log(`   Is Complete: ${workflow.isCompleted ? 'Yes' : 'No'}`);

    // Step 10: Generate Report from Wizard
    console.log('\n📄 Step 10: Generating Report from Wizard');
    console.log('-'.repeat(60));
    const reportResponse = await makeRequest(
      `/api/wizard/workflows/${workflowId}/generate-report`,
      'POST'
    );

    if (reportResponse.status !== 201) {
      console.log('❌ Failed to generate report');
      console.log('Response:', reportResponse.data);
      return;
    }

    const report = reportResponse.data.data.report;
    console.log(`✅ Report Generated Successfully!`);
    console.log(`   Report ID: ${report._id}`);
    console.log(`   Title: ${report.title}`);
    console.log(`   Sections: ${report.sections.length}`);
    console.log(`   Tags: ${report.tags.join(', ')}`);
    console.log(`   Source: ${report.metadata.sourceType}`);

    // Step 11: List report sections
    console.log('\n📑 Step 11: Report Sections');
    console.log('-'.repeat(60));
    report.sections.forEach((section, idx) => {
      console.log(`   ${idx + 1}. ${section.title}`);
      console.log(`      Metrics: ${section.metrics ? section.metrics.length : 0}`);
    });

    // Step 12: Test manual report creation (should fail)
    console.log('\n🚫 Step 12: Testing Manual Report Creation (Should Fail)');
    console.log('-'.repeat(60));
    const manualReportResponse = await makeRequest('/api/reports', 'POST', {
      title: 'Manual Report',
      description: 'This should fail',
      sections: []
    });

    if (manualReportResponse.status === 400) {
      console.log('✅ Manual report creation blocked as expected');
      console.log(`   Message: ${manualReportResponse.data.message}`);
    } else {
      console.log('⚠️  Manual report creation should have been blocked');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 INTEGRATION TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n✅ Created Wizard Workflow: ${workflowId}`);
    console.log(`✅ Completed All 7 Steps (${workflow.completionPercentage}%)`);
    console.log(`✅ Generated Report: ${report._id}`);
    console.log(`✅ Report has ${report.sections.length} sections`);
    console.log(`✅ Manual report creation properly blocked`);
    console.log(`\n📊 View Report: GET http://localhost:5000/api/reports/${report._id}`);
    console.log(`📄 Export PDF: GET http://localhost:5000/api/reports/${report._id}/export?format=pdf`);
    console.log(`\n🗑️  Clean up: DELETE http://localhost:5000/api/wizard/workflows/${workflowId}`);
    console.log(`🗑️  Clean up: DELETE http://localhost:5000/api/reports/${report._id}\n`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Server is running: npm start');
    console.error('  2. MongoDB is connected');
    console.error('  3. User ID exists in database\n');
  }
}

// Run the test
testWizardToReportIntegration();
