/**
 * Seed Database Script
 * 
 * This script populates mock data into MongoDB for:
 * - Users
 * - Projects
 * - Insights
 * - Benchmarks
 * 
 * Usage: node scripts/seedDatabase.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Insight = require('../src/models/Insight');
const Benchmark = require('../src/models/Benchmark');

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Clear existing data
 */
async function clearData() {
  try {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Insight.deleteMany({});
    await Benchmark.deleteMany({});
    console.log('✓ Existing data cleared');
  } catch (error) {
    console.error('✗ Failed to clear data:', error.message);
    throw error;
  }
}

/**
 * Create mock users
 */
async function createUsers() {
  const users = [
    {
      name: 'Hashim Ansari',
      email: 'hashim@example.com',
      organization: 'Green Industries Ltd',
      role: 'manager',
      subscription: 'pro',
      password: 'password123'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      organization: 'Circular Economy Corp',
      role: 'engineer',
      subscription: 'pro',
      password: 'password123'
    },
    {
      name: 'Michael Chen',
      email: 'michael@example.com',
      organization: 'Sustainability Solutions',
      role: 'researcher',
      subscription: 'enterprise',
      password: 'password123'
    },
    {
      name: 'Emma Wilson',
      email: 'emma@example.com',
      organization: 'Environmental Consultants',
      role: 'policymaker',
      subscription: 'basic',
      password: 'password123'
    },
    {
      name: 'David Kumar',
      email: 'david@example.com',
      organization: 'Metal Recycling Inc',
      role: 'engineer',
      subscription: 'pro',
      password: 'password123'
    }
  ];

  const hashedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return { ...user, password: hashedPassword };
    })
  );

  const createdUsers = await User.insertMany(hashedUsers);
  console.log(`✓ Created ${createdUsers.length} users`);
  return createdUsers;
}

/**
 * Create mock projects
 */
async function createProjects(users) {
  const projects = [
    {
      name: 'Premium Aluminum Beverage Can Initiative',
      metalType: 'Aluminum',
      processType: 'Recycling & Manufacturing',
      circularityScore: 92,
      gwp: 8.3,
      status: 'completed',
      owner: users[0]._id,
      metadata: { region: 'Europe & Asia', volume: 15000, targetDate: '2025-Q2' }
    },
    {
      name: 'Copper Smelting Optimization',
      metalType: 'Copper',
      processType: 'Smelting',
      circularityScore: 72,
      gwp: 25.3,
      status: 'in-progress',
      owner: users[1]._id,
      metadata: { region: 'Asia', volume: 8000 }
    },
    {
      name: 'Advanced Steel Recycling & Carbon Reduction',
      metalType: 'Steel',
      processType: 'Advanced Recycling',
      circularityScore: 84,
      gwp: 9.2,
      status: 'in-progress',
      owner: users[0]._id,
      metadata: { region: 'North America & Europe', volume: 25000, certifications: ['ISO14001', 'B-Corp'] }
    },
    {
      name: 'Titanium Mining Sustainability',
      metalType: 'Titanium',
      processType: 'Mining',
      circularityScore: 45,
      gwp: 35.6,
      status: 'draft',
      owner: users[2]._id,
      metadata: { region: 'Africa', volume: 2000 }
    },
    {
      name: 'Lithium Refining Excellence',
      metalType: 'Lithium',
      processType: 'Refining',
      circularityScore: 78,
      gwp: 22.1,
      status: 'completed',
      owner: users[4]._id,
      metadata: { region: 'South America', volume: 3000 }
    },
    {
      name: 'Nickel Valorization Program',
      metalType: 'Nickel',
      processType: 'Valorization',
      circularityScore: 58,
      gwp: 28.7,
      status: 'draft',
      owner: users[1]._id,
      metadata: { region: 'Asia-Pacific', volume: 4500 }
    },
    {
      name: 'Gold Mining Environmental Impact Study',
      metalType: 'Gold',
      processType: 'Mining',
      circularityScore: 35,
      gwp: 42.3,
      status: 'in-progress',
      owner: users[2]._id,
      metadata: { region: 'Africa', volume: 1000 }
    },
    {
      name: 'Zinc Manufacturing Circularity',
      metalType: 'Zinc',
      processType: 'Manufacturing',
      circularityScore: 76,
      gwp: 19.4,
      status: 'completed',
      owner: users[0]._id,
      metadata: { region: 'Europe', volume: 6000 }
    }
  ];

  const createdProjects = await Project.insertMany(projects);
  console.log(`✓ Created ${createdProjects.length} projects`);
  return createdProjects;
}

/**
 * Create mock insights
 */
async function createInsights(projects) {
  const insights = [
    {
      type: 'optimization',
      title: 'Improve Energy Efficiency in Smelting Process',
      description: 'Implement advanced cooling systems to reduce energy consumption by 15-20%. This will decrease GWP from 25.3 to approximately 21.5 kg CO2-eq per ton.',
      confidenceScore: 0.92,
      relatedProjectId: projects[1]._id,
      priority: 'high',
      action: { recommended: 'Replace cooling systems', estimatedSavings: '$450,000/year' }
    },
    {
      type: 'risk',
      title: 'High Environmental Impact in Titanium Mining',
      description: 'Current titanium mining operations show high GWP of 35.6. Recommend transitioning to more sustainable extraction methods.',
      confidenceScore: 0.85,
      relatedProjectId: projects[3]._id,
      priority: 'critical',
      action: { recommended: 'Conduct environmental audit', timeframe: '30 days' }
    },
    {
      type: 'opportunity',
      title: 'Scale Premium Aluminum Recycling Program Globally',
      description: 'Your premium aluminum initiative achieved 92% circularity with exceptional results. Opportunity to expand to 15,000+ tons and capture international markets.',
      confidenceScore: 0.91,
      relatedProjectId: projects[0]._id,
      priority: 'high',
      action: { recommended: 'Global expansion strategy', targetVolume: '25000 tons', investmentRequired: '$2.5M' }
    },
    {
      type: 'compliance',
      title: 'Meet EU Green Taxonomy Requirements',
      description: 'Your lithium refining project meets 95% of EU Green Taxonomy criteria. Minor adjustments needed for full compliance.',
      confidenceScore: 0.90,
      relatedProjectId: projects[4]._id,
      priority: 'medium',
      action: { recommended: 'Update documentation', deadline: 'Q4 2024' }
    },
    {
      type: 'sustainability',
      title: 'Advanced Steel Recycling Achieves Industry Leadership',
      description: 'Your advanced steel recycling achieved 84% circularity with significantly reduced carbon footprint. Eligible for premium ESG certifications and investor incentives.',
      confidenceScore: 0.93,
      relatedProjectId: projects[2]._id,
      priority: 'high',
      action: { recommended: 'Pursue B-Corp & ISO14001 certification', potentialSavings: '$500,000/year in carbon credits', investmentRequired: '$50,000' }
    },
    {
      type: 'sustainability',
      title: 'Improve Water Usage in Manufacturing',
      description: 'Implement water recycling systems to reduce freshwater consumption by 50% in zinc manufacturing.',
      confidenceScore: 0.82,
      relatedProjectId: projects[7]._id,
      priority: 'high',
      action: { recommended: 'Install water treatment', investmentRequired: '$150,000' }
    },
    {
      type: 'warning',
      title: 'Monitor Gold Mining Circularity Decline',
      description: 'Gold mining operations showing declining circularity trend. Immediate attention required to prevent further deterioration.',
      confidenceScore: 0.88,
      relatedProjectId: projects[6]._id,
      priority: 'critical',
      action: { recommended: 'Emergency audit', timeline: '2 weeks' }
    },
    {
      type: 'efficiency',
      title: 'Automate Quality Control in Copper Smelting',
      description: 'Implement AI-powered quality control to increase efficiency by 25% and reduce waste by 30%.',
      confidenceScore: 0.79,
      relatedProjectId: projects[1]._id,
      priority: 'medium',
      action: { recommended: 'Deploy AI system', expectedROI: '18 months' }
    }
  ];

  const createdInsights = await Insight.insertMany(insights);
  console.log(`✓ Created ${createdInsights.length} insights`);
  return createdInsights;
}

/**
 * Create mock benchmarks
 */
async function createBenchmarks(users, projects) {
  const benchmarks = [
    {
      userId: users[0]._id,
      userAverageCircularity: 76.33,
      industryMedianCircularity: 62,
      userPercentile: 82,
      period: 'monthly',
      projectCount: 3,
      comparisonSectors: ['recycling', 'manufacturing', 'smelting']
    },
    {
      userId: users[1]._id,
      userAverageCircularity: 65,
      industryMedianCircularity: 62,
      userPercentile: 58,
      period: 'monthly',
      projectCount: 2,
      comparisonSectors: ['smelting', 'valorization']
    },
    {
      userId: users[2]._id,
      userAverageCircularity: 56.5,
      industryMedianCircularity: 62,
      userPercentile: 35,
      period: 'monthly',
      projectCount: 2,
      comparisonSectors: ['mining', 'refining']
    },
    {
      userId: users[4]._id,
      userAverageCircularity: 78,
      industryMedianCircularity: 62,
      userPercentile: 88,
      period: 'monthly',
      projectCount: 1,
      comparisonSectors: ['refining', 'manufacturing']
    },
    {
      userId: users[0]._id,
      userAverageCircularity: 75,
      industryMedianCircularity: 60,
      userPercentile: 80,
      period: 'quarterly',
      projectCount: 3,
      comparisonSectors: ['recycling', 'manufacturing']
    }
  ];

  const createdBenchmarks = await Benchmark.insertMany(benchmarks);
  console.log(`✓ Created ${createdBenchmarks.length} benchmarks`);
  return createdBenchmarks;
}

/**
 * Main seed function
 */
async function seedDatabase() {
  try {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║        Database Seeding Started           ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    // Connect to DB
    await connectDB();

    // Clear existing data
    await clearData();

    // Create data in order
    const users = await createUsers();
    const projects = await createProjects(users);
    const insights = await createInsights(projects);
    const benchmarks = await createBenchmarks(users, projects);

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║     ✓ Database Seeding Complete!          ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`  Users: ${users.length}`);
    console.log(`  Projects: ${projects.length}`);
    console.log(`  Insights: ${insights.length}`);
    console.log(`  Benchmarks: ${benchmarks.length}`);
    console.log('\n✓ All mock data has been added to MongoDB\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
