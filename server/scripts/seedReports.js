/**
 * Seed Reports Script
 * 
 * Populates the database with sample sustainability and circularity reports
 * for testing and demonstration purposes.
 * 
 * Usage: node scripts/seedReports.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { Report, Project, User } = require('../src/models');

// Sample reports data
const sampleReports = [
  {
    title: 'Q3 2025 Aluminum Circularity Assessment',
    description: 'Comprehensive quarterly report on aluminum recycling operations and environmental impact metrics for Site A facilities.',
    status: 'final',
    visibility: 'public',
    tags: ['aluminum', 'q3-2025', 'circularity', 'site-a'],
    sections: [
      {
        title: 'Executive Summary',
        order: 1,
        content: 'This quarter demonstrated significant improvements in aluminum recovery rates, achieving a 15% increase compared to Q2 2025. Key highlights include enhanced sorting technologies and optimized smelting processes.',
        metrics: [
          {
            name: 'recovery_rate',
            label: 'Material Recovery Rate',
            value: 87.5,
            unit: '%',
            baseline: 72.3,
            change: 15.2
          },
          {
            name: 'energy_consumption',
            label: 'Energy Consumption',
            value: 4250,
            unit: 'kWh/ton',
            baseline: 4800,
            change: -11.5
          }
        ]
      },
      {
        title: 'Environmental Impact',
        order: 2,
        content: 'Life Cycle Assessment shows reduced carbon footprint through improved process efficiency and increased use of renewable energy sources.',
        metrics: [
          {
            name: 'co2e_emissions',
            label: 'CO2 Equivalent Emissions',
            value: 1532.8,
            unit: 'kg CO2e/ton',
            baseline: 1820.5,
            change: -15.8
          },
          {
            name: 'water_usage',
            label: 'Water Usage',
            value: 2.8,
            unit: 'm³/ton',
            baseline: 3.5,
            change: -20.0
          }
        ]
      },
      {
        title: 'Economic Analysis',
        order: 3,
        content: 'Cost-benefit analysis demonstrates positive ROI from circularity initiatives, with operational cost reductions of 12% year-over-year.',
        metrics: [
          {
            name: 'cost_savings',
            label: 'Operational Cost Savings',
            value: 125000,
            unit: 'USD',
            baseline: 0,
            change: 100
          },
          {
            name: 'revenue_recycled',
            label: 'Revenue from Recycled Materials',
            value: 890000,
            unit: 'USD'
          }
        ]
      }
    ],
    metadata: {
      reportingPeriod: 'Q3 2025',
      facility: 'Site A',
      certifications: ['ISO 14001', 'ISO 50001'],
      auditor: 'Environmental Compliance Team'
    }
  },
  {
    title: 'Copper Mining Sustainability Report 2025',
    description: 'Annual sustainability report covering copper mining operations, focusing on environmental stewardship and community impact.',
    status: 'final',
    visibility: 'public',
    tags: ['copper', 'mining', '2025', 'sustainability'],
    sections: [
      {
        title: 'Overview',
        order: 1,
        content: 'This report presents our comprehensive approach to sustainable copper mining, including environmental protection measures, community engagement, and operational efficiency improvements.',
        metrics: [
          {
            name: 'ore_extracted',
            label: 'Total Ore Extracted',
            value: 1250000,
            unit: 'tons'
          },
          {
            name: 'copper_production',
            label: 'Copper Production',
            value: 45000,
            unit: 'tons'
          }
        ]
      },
      {
        title: 'Environmental Management',
        order: 2,
        content: 'Implemented advanced water treatment systems and biodiversity conservation programs across all mining sites.',
        metrics: [
          {
            name: 'water_recycled',
            label: 'Water Recycling Rate',
            value: 78.5,
            unit: '%',
            baseline: 65.0,
            change: 13.5
          },
          {
            name: 'land_rehabilitated',
            label: 'Land Rehabilitated',
            value: 125,
            unit: 'hectares'
          },
          {
            name: 'biodiversity_index',
            label: 'Biodiversity Index',
            value: 0.82,
            unit: 'score',
            baseline: 0.75,
            change: 9.3
          }
        ]
      },
      {
        title: 'Safety & Community',
        order: 3,
        content: 'Zero fatality record maintained for 18 consecutive months. Community investment programs reached 15,000 beneficiaries.',
        metrics: [
          {
            name: 'ltifr',
            label: 'Lost Time Injury Frequency Rate',
            value: 0.42,
            unit: 'per million hours',
            baseline: 0.68,
            change: -38.2
          },
          {
            name: 'community_investment',
            label: 'Community Investment',
            value: 2500000,
            unit: 'USD'
          }
        ]
      }
    ],
    metadata: {
      reportingYear: 2025,
      framework: 'GRI Standards',
      assurance: 'Third-party verified'
    }
  },
  {
    title: 'Steel Manufacturing LCA Study - Prototype Plant',
    description: 'Life Cycle Assessment of innovative steel manufacturing process using 80% recycled content.',
    status: 'draft',
    visibility: 'project',
    tags: ['steel', 'lca', 'prototype', 'recycled-content'],
    sections: [
      {
        title: 'Methodology',
        order: 1,
        content: 'This LCA follows ISO 14040/14044 standards, assessing environmental impacts from raw material extraction through end-of-life recycling.',
        metrics: []
      },
      {
        title: 'Results Summary',
        order: 2,
        content: 'Preliminary results show 45% reduction in GWP compared to conventional steel production methods.',
        metrics: [
          {
            name: 'gwp',
            label: 'Global Warming Potential',
            value: 1.2,
            unit: 'kg CO2e/kg steel',
            baseline: 2.18,
            change: -44.95
          },
          {
            name: 'recycled_content',
            label: 'Recycled Content',
            value: 82,
            unit: '%'
          },
          {
            name: 'energy_intensity',
            label: 'Energy Intensity',
            value: 18.5,
            unit: 'MJ/kg'
          }
        ]
      }
    ],
    metadata: {
      studyPhase: 'preliminary',
      dataQuality: 'medium',
      geographicScope: 'Regional'
    }
  },
  {
    title: 'Battery Recycling Pilot Program - Monthly Update',
    description: 'Monthly operational report for lithium-ion battery recycling pilot program.',
    status: 'draft',
    visibility: 'private',
    tags: ['battery', 'lithium-ion', 'recycling', 'pilot'],
    sections: [
      {
        title: 'Operations Overview',
        order: 1,
        content: 'Processed 2.5 tons of end-of-life lithium-ion batteries this month. Recovery rates for key materials exceeded targets.',
        metrics: [
          {
            name: 'batteries_processed',
            label: 'Batteries Processed',
            value: 2.5,
            unit: 'tons'
          },
          {
            name: 'lithium_recovery',
            label: 'Lithium Recovery Rate',
            value: 92,
            unit: '%'
          },
          {
            name: 'cobalt_recovery',
            label: 'Cobalt Recovery Rate',
            value: 96,
            unit: '%'
          }
        ]
      },
      {
        title: 'Challenges & Next Steps',
        order: 2,
        content: 'Identified optimization opportunities in the sorting phase. Planning to implement automated disassembly line next quarter.',
        metrics: []
      }
    ],
    metadata: {
      reportMonth: 'September 2025',
      facility: 'Pilot Plant B',
      stage: 'testing'
    }
  },
  {
    title: 'Zinc Refining Environmental Performance 2024-2025',
    description: 'Biannual report on environmental performance indicators for zinc refining operations.',
    status: 'final',
    visibility: 'public',
    tags: ['zinc', 'refining', 'environmental', '2024-2025'],
    sections: [
      {
        title: 'Air Quality Management',
        order: 1,
        content: 'All air emissions remained well below regulatory limits. Implemented new scrubber technology reduced particulate emissions by 35%.',
        metrics: [
          {
            name: 'so2_emissions',
            label: 'SO2 Emissions',
            value: 0.45,
            unit: 'kg/ton zinc',
            baseline: 0.68,
            change: -33.8
          },
          {
            name: 'particulates',
            label: 'Particulate Matter',
            value: 0.12,
            unit: 'kg/ton zinc',
            baseline: 0.185,
            change: -35.1
          }
        ]
      },
      {
        title: 'Waste Management',
        order: 2,
        content: 'Achieved 95% waste diversion from landfill through improved recovery and valorization of process residues.',
        metrics: [
          {
            name: 'waste_diverted',
            label: 'Waste Diversion Rate',
            value: 95.2,
            unit: '%',
            baseline: 88.5,
            change: 6.7
          },
          {
            name: 'hazardous_waste',
            label: 'Hazardous Waste Generated',
            value: 42,
            unit: 'tons',
            baseline: 58,
            change: -27.6
          }
        ]
      },
      {
        title: 'Resource Efficiency',
        order: 3,
        content: 'Process optimization initiatives resulted in significant improvements in material and energy efficiency.',
        metrics: [
          {
            name: 'energy_per_ton',
            label: 'Energy Consumption',
            value: 3200,
            unit: 'kWh/ton',
            baseline: 3750,
            change: -14.7
          },
          {
            name: 'water_consumption',
            label: 'Water Consumption',
            value: 1.8,
            unit: 'm³/ton',
            baseline: 2.4,
            change: -25.0
          }
        ]
      }
    ],
    metadata: {
      reportingPeriod: '2024-2025',
      compliance: 'Full regulatory compliance',
      standards: ['ISO 14001', 'EMAS']
    }
  }
];

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/lca-platform';
    
    await mongoose.connect(mongoURI);
    
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Seed reports into the database
 */
async function seedReports() {
  try {
    console.log('\n📊 Starting Report Seeding Process...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing reports (optional - comment out if you want to preserve existing data)
    const deleteCount = await Report.countDocuments();
    if (deleteCount > 0) {
      console.log(`⚠  Found ${deleteCount} existing reports`);
      console.log('   Clearing existing reports...');
      await Report.deleteMany({});
      console.log('✓ Existing reports cleared\n');
    }
    
    // Get first project and user for referencing (if they exist)
    const sampleProject = await Project.findOne();
    const sampleUser = await User.findOne();
    
    if (sampleProject) {
      console.log(`✓ Found sample project: ${sampleProject.name} (${sampleProject._id})`);
      // Link first two reports to this project
      sampleReports[0].projectId = sampleProject._id;
      sampleReports[1].projectId = sampleProject._id;
    } else {
      console.log('⚠  No projects found. Reports will be created without project links.');
    }
    
    if (sampleUser) {
      console.log(`✓ Found sample user: ${sampleUser.name} (${sampleUser.email})\n`);
      // Set author for all reports
      sampleReports.forEach(report => {
        report.author = {
          userId: sampleUser._id,
          name: sampleUser.name,
          email: sampleUser.email
        };
      });
    } else {
      console.log('⚠  No users found. Reports will use default author.\n');
      // Set default author
      sampleReports.forEach(report => {
        report.author = {
          name: 'System Administrator',
          email: 'admin@lca-platform.com'
        };
      });
    }
    
    // Insert reports
    console.log('📝 Creating sample reports...\n');
    
    const createdReports = await Report.insertMany(sampleReports);
    
    console.log(`✓ Successfully created ${createdReports.length} reports:\n`);
    
    createdReports.forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.title}`);
      console.log(`      ID: ${report._id}`);
      console.log(`      Status: ${report.status}`);
      console.log(`      Visibility: ${report.visibility}`);
      console.log(`      Sections: ${report.sections.length}`);
      console.log(`      Total Metrics: ${report.totalMetrics}`);
      console.log(`      Tags: ${report.tags.join(', ')}`);
      console.log('');
    });
    
    // Print statistics
    const stats = await Report.getStatistics();
    console.log('📈 Report Statistics:');
    console.log(`   Total Reports: ${stats.totalReports}`);
    console.log(`   Total Sections: ${stats.totalSections}`);
    console.log(`   By Status:`, stats.byStatus);
    console.log(`   By Visibility:`, stats.byVisibility);
    console.log('');
    
    console.log('✅ Report seeding completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error seeding reports:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedReports()
    .then(() => {
      console.log('\n🎉 Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding process failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedReports, sampleReports };
