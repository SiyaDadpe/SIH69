/**
 * Seed Operations Database
 * 
 * Populates the database with all available LCA operations across 7 stages
 * 
 * Usage: node scripts/seedOperations.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Operation = require('../src/models/Operation');

const { connectDB } = require('../src/config');

async function seedOperations() {
  try {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║     Seeding Operations Database           ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    await connectDB();

    // Clear existing operations
    await Operation.deleteMany({});
    console.log('✓ Cleared existing operations');

    // Stage 1: Extraction Operations
    const stage1Operations = [
      {
        name: 'Open Pit Mining',
        description: 'Large-scale surface mining for metal extraction',
        stage: 'stage1-extraction',
        metalTypes: ['Aluminium', 'Copper', 'Gold', 'Titanium', 'Nickel'],
        category: 'Extraction',
        gwp: 45.2,
        waterUsage: 2500,
        wasteGenerated: 35,
        energyRequired: 250,
        recoveryRate: 75,
        icon: { name: 'Mountain', color: '#8B4513' }
      },
      {
        name: 'Strip Mining',
        description: 'Surface mining technique for mineral extraction',
        stage: 'stage1-extraction',
        metalTypes: ['Aluminium', 'Titanium', 'Lithium'],
        category: 'Extraction',
        gwp: 42.5,
        waterUsage: 2200,
        wasteGenerated: 32,
        energyRequired: 220,
        recoveryRate: 78,
        icon: { name: 'Layers', color: '#A0522D' }
      },
      {
        name: 'Underground Mining',
        description: 'Deep mining operations for ore extraction',
        stage: 'stage1-extraction',
        metalTypes: ['Copper', 'Gold', 'Nickel', 'Zinc'],
        category: 'Extraction',
        gwp: 55.8,
        waterUsage: 1800,
        wasteGenerated: 28,
        energyRequired: 320,
        recoveryRate: 82,
        icon: { name: 'Zap', color: '#696969' }
      },
      {
        name: 'Drilling & Blasting',
        description: 'Controlled explosions for ore extraction',
        stage: 'stage1-extraction',
        metalTypes: ['Copper', 'Gold', 'Titanium', 'Nickel'],
        category: 'Extraction',
        gwp: 38.9,
        waterUsage: 1500,
        wasteGenerated: 25,
        energyRequired: 180,
        recoveryRate: 80,
        icon: { name: 'Bomb', color: '#FF6347' }
      },
      {
        name: 'Manual Extraction',
        description: 'Small-scale manual mining operations',
        stage: 'stage1-extraction',
        metalTypes: ['Gold', 'Copper'],
        category: 'Extraction',
        gwp: 15.5,
        waterUsage: 800,
        wasteGenerated: 18,
        energyRequired: 45,
        recoveryRate: 65,
        icon: { name: 'Pickaxe', color: '#808080' }
      },
      {
        name: 'Hydraulic Mining',
        description: 'Water-based extraction technique',
        stage: 'stage1-extraction',
        metalTypes: ['Gold', 'Titanium'],
        category: 'Extraction',
        gwp: 22.3,
        waterUsage: 3500,
        wasteGenerated: 40,
        energyRequired: 120,
        recoveryRate: 72,
        icon: { name: 'Waves', color: '#4169E1' }
      }
    ];

    // Stage 2: Processing Operations
    const stage2Operations = [
      {
        name: 'Crushing',
        description: 'Breaking ore into smaller particles',
        stage: 'stage2-processing',
        metalTypes: ['universal'],
        category: 'Processing',
        gwp: 18.5,
        waterUsage: 500,
        wasteGenerated: 12,
        energyRequired: 150,
        recoveryRate: 85,
        icon: { name: 'Zap', color: '#FF8C00' }
      },
      {
        name: 'Grinding',
        description: 'Fine grinding of ore particles',
        stage: 'stage2-processing',
        metalTypes: ['universal'],
        category: 'Processing',
        gwp: 22.1,
        waterUsage: 600,
        wasteGenerated: 15,
        energyRequired: 180,
        recoveryRate: 82,
        icon: { name: 'Cog', color: '#A52A2A' }
      },
      {
        name: 'Gravity Separation',
        description: 'Separation based on density differences',
        stage: 'stage2-processing',
        metalTypes: ['universal'],
        category: 'Processing',
        gwp: 8.5,
        waterUsage: 800,
        wasteGenerated: 8,
        energyRequired: 60,
        recoveryRate: 75,
        icon: { name: 'Layers', color: '#2F4F4F' }
      },
      {
        name: 'Flotation Methods',
        description: 'Chemical flotation for mineral separation',
        stage: 'stage2-processing',
        metalTypes: ['Copper', 'Nickel', 'Zinc'],
        category: 'Processing',
        gwp: 35.2,
        waterUsage: 1200,
        wasteGenerated: 22,
        energyRequired: 200,
        recoveryRate: 88,
        icon: { name: 'Wind', color: '#1E90FF' }
      },
      {
        name: 'Magnetic Separation',
        description: 'Separation using magnetic properties',
        stage: 'stage2-processing',
        metalTypes: ['Steel', 'Titanium'],
        category: 'Processing',
        gwp: 12.3,
        waterUsage: 300,
        wasteGenerated: 5,
        energyRequired: 100,
        recoveryRate: 92,
        icon: { name: 'Magnet', color: '#DC143C' }
      },
      {
        name: 'Washing & Screening',
        description: 'Cleaning and size classification',
        stage: 'stage2-processing',
        metalTypes: ['universal'],
        category: 'Processing',
        gwp: 6.8,
        waterUsage: 2000,
        wasteGenerated: 10,
        energyRequired: 45,
        recoveryRate: 80,
        icon: { name: 'Droplet', color: '#00BFFF' }
      }
    ];

    // Stage 3A: Alumina Refining (Aluminum specific)
    const stage3aOperations = [
      {
        name: 'Crushing (Alumina Refining)',
        description: 'Crushing bauxite for alumina extraction',
        stage: 'stage3a-alumina-refining',
        metalTypes: ['Aluminium'],
        category: 'Alumina Refining',
        gwp: 15.2,
        waterUsage: 400,
        wasteGenerated: 8,
        energyRequired: 80,
        recoveryRate: 90,
        icon: { name: 'Zap', color: '#FFD700' }
      },
      {
        name: 'Digestion (caustic soda)',
        description: 'Leaching with caustic soda solution',
        stage: 'stage3a-alumina-refining',
        metalTypes: ['Aluminium'],
        category: 'Alumina Refining',
        gwp: 28.5,
        waterUsage: 800,
        wasteGenerated: 15,
        energyRequired: 120,
        recoveryRate: 92,
        icon: { name: 'Droplet', color: '#FFD700' }
      },
      {
        name: 'Clarification (separating)',
        description: 'Separation of red mud from alumina solution',
        stage: 'stage3a-alumina-refining',
        metalTypes: ['Aluminium'],
        category: 'Alumina Refining',
        gwp: 12.1,
        waterUsage: 600,
        wasteGenerated: 10,
        energyRequired: 70,
        recoveryRate: 88,
        icon: { name: 'Filter', color: '#FFD700' }
      },
      {
        name: 'Precipitation (alumina)',
        description: 'Precipitating aluminum hydroxide',
        stage: 'stage3a-alumina-refining',
        metalTypes: ['Aluminium'],
        category: 'Alumina Refining',
        gwp: 18.7,
        waterUsage: 500,
        wasteGenerated: 12,
        energyRequired: 90,
        recoveryRate: 95,
        icon: { name: 'Cloud', color: '#FFD700' }
      },
      {
        name: 'Calcination (removal of water)',
        description: 'Heating to remove water and produce alumina',
        stage: 'stage3a-alumina-refining',
        metalTypes: ['Aluminium'],
        category: 'Alumina Refining',
        gwp: 35.3,
        waterUsage: 200,
        wasteGenerated: 5,
        energyRequired: 250,
        recoveryRate: 98,
        icon: { name: 'Flame', color: '#FFD700' }
      }
    ];

    // Stage 4: Smelting Operations
    const stage4Operations = [
      {
        name: 'Pre-baking anodes',
        description: 'Preparation of carbon anodes for smelting',
        stage: 'stage4-smelting',
        metalTypes: ['universal'],
        category: 'Smelting',
        gwp: 32.5,
        waterUsage: 300,
        wasteGenerated: 8,
        energyRequired: 180,
        recoveryRate: 85,
        icon: { name: 'Zap', color: '#FF4500' }
      },
      {
        name: 'Electrolysis (cell operation)',
        description: 'Electrochemical separation of metal',
        stage: 'stage4-smelting',
        metalTypes: ['Aluminium', 'Copper'],
        category: 'Smelting',
        gwp: 85.3,
        waterUsage: 1000,
        wasteGenerated: 12,
        energyRequired: 1200,
        recoveryRate: 95,
        icon: { name: 'Zap', color: '#FF4500' }
      },
      {
        name: 'Anode effect control',
        description: 'Managing anode voltage during electrolysis',
        stage: 'stage4-smelting',
        metalTypes: ['Aluminium'],
        category: 'Smelting',
        gwp: 15.8,
        waterUsage: 400,
        wasteGenerated: 5,
        energyRequired: 150,
        recoveryRate: 92,
        icon: { name: 'Zap', color: '#FF4500' }
      },
      {
        name: 'Bath chemistry management',
        description: 'Maintaining electrolyte composition',
        stage: 'stage4-smelting',
        metalTypes: ['Aluminium'],
        category: 'Smelting',
        gwp: 12.1,
        waterUsage: 200,
        wasteGenerated: 3,
        energyRequired: 80,
        recoveryRate: 98,
        icon: { name: 'Beaker', color: '#FF4500' }
      },
      {
        name: 'Off-gas treatment',
        description: 'Treatment of greenhouse gases',
        stage: 'stage4-smelting',
        metalTypes: ['universal'],
        category: 'Smelting',
        gwp: 22.3,
        waterUsage: 500,
        wasteGenerated: 8,
        energyRequired: 120,
        recoveryRate: 80,
        icon: { name: 'Wind', color: '#FF4500' }
      }
    ];

    // Stage 5: Manufacturing Operations
    const stage5Operations = [
      {
        name: 'Casting (ingots, billets)',
        description: 'Casting molten metal into ingots',
        stage: 'stage5-manufacturing',
        metalTypes: ['universal'],
        category: 'Manufacturing',
        gwp: 18.5,
        waterUsage: 800,
        wasteGenerated: 15,
        energyRequired: 200,
        recoveryRate: 90,
        icon: { name: 'Box', color: '#8B0000' }
      },
      {
        name: 'Rolling (sheet metal)',
        description: 'Rolling metal into sheets',
        stage: 'stage5-manufacturing',
        metalTypes: ['Aluminium', 'Steel', 'Copper'],
        category: 'Manufacturing',
        gwp: 22.1,
        waterUsage: 600,
        wasteGenerated: 10,
        energyRequired: 250,
        recoveryRate: 92,
        icon: { name: 'Repeat', color: '#8B0000' }
      },
      {
        name: 'Extrusion (tubes, profiles)',
        description: 'Extruding metal into profiles',
        stage: 'stage5-manufacturing',
        metalTypes: ['Aluminium', 'Copper'],
        category: 'Manufacturing',
        gwp: 25.3,
        waterUsage: 400,
        wasteGenerated: 12,
        energyRequired: 280,
        recoveryRate: 85,
        icon: { name: 'Zap', color: '#8B0000' }
      },
      {
        name: 'Forging (metal strengthening)',
        description: 'Forging for strength enhancement',
        stage: 'stage5-manufacturing',
        metalTypes: ['Steel', 'Titanium', 'Nickel'],
        category: 'Manufacturing',
        gwp: 28.9,
        waterUsage: 700,
        wasteGenerated: 18,
        energyRequired: 320,
        recoveryRate: 88,
        icon: { name: 'Hammer', color: '#8B0000' }
      },
      {
        name: 'Surface Treatment',
        description: 'Surface finishing and protection',
        stage: 'stage5-manufacturing',
        metalTypes: ['universal'],
        category: 'Manufacturing',
        gwp: 12.5,
        waterUsage: 900,
        wasteGenerated: 8,
        energyRequired: 100,
        recoveryRate: 75,
        icon: { name: 'Brush', color: '#8B0000' }
      },
      {
        name: 'Joining Processes',
        description: 'Welding and joining operations',
        stage: 'stage5-manufacturing',
        metalTypes: ['universal'],
        category: 'Manufacturing',
        gwp: 15.8,
        waterUsage: 300,
        wasteGenerated: 5,
        energyRequired: 150,
        recoveryRate: 92,
        icon: { name: 'Zap', color: '#8B0000' }
      }
    ];

    // Stage 6: Recycling Operations
    const stage6Operations = [
      {
        name: 'Collection (scrap gathering)',
        description: 'Collecting scrap metal',
        stage: 'stage6-recycling',
        metalTypes: ['universal'],
        category: 'Recycling',
        gwp: 3.5,
        waterUsage: 50,
        wasteGenerated: 2,
        energyRequired: 20,
        recoveryRate: 95,
        icon: { name: 'Package', color: '#228B22' }
      },
      {
        name: 'Sorting',
        description: 'Sorting different metal types',
        stage: 'stage6-recycling',
        metalTypes: ['universal'],
        category: 'Recycling',
        gwp: 4.2,
        waterUsage: 100,
        wasteGenerated: 3,
        energyRequired: 30,
        recoveryRate: 98,
        icon: { name: 'Filter', color: '#228B22' }
      },
      {
        name: 'Cleaning (removal of oils)',
        description: 'Cleaning contaminated scrap',
        stage: 'stage6-recycling',
        metalTypes: ['universal'],
        category: 'Recycling',
        gwp: 5.1,
        waterUsage: 500,
        wasteGenerated: 4,
        energyRequired: 40,
        recoveryRate: 92,
        icon: { name: 'Droplet', color: '#228B22' }
      },
      {
        name: 'Remelting (furnace heating)',
        description: 'Remelting scrap metal',
        stage: 'stage6-recycling',
        metalTypes: ['universal'],
        category: 'Recycling',
        gwp: 15.3,
        waterUsage: 300,
        wasteGenerated: 5,
        energyRequired: 180,
        recoveryRate: 96,
        icon: { name: 'Flame', color: '#228B22' }
      },
      {
        name: 'Re-alloying (composition correction)',
        description: 'Adjusting alloy composition',
        stage: 'stage6-recycling',
        metalTypes: ['Aluminium', 'Copper', 'Steel'],
        category: 'Recycling',
        gwp: 8.7,
        waterUsage: 200,
        wasteGenerated: 2,
        energyRequired: 100,
        recoveryRate: 99,
        icon: { name: 'Layers', color: '#228B22' }
      },
      {
        name: 'Casting into new products',
        description: 'Casting recycled metal into new products',
        stage: 'stage6-recycling',
        metalTypes: ['universal'],
        category: 'Recycling',
        gwp: 6.2,
        waterUsage: 250,
        wasteGenerated: 3,
        energyRequired: 60,
        recoveryRate: 97,
        icon: { name: 'Box', color: '#228B22' }
      }
    ];

    // Stage 7: Valorization Operations
    const stage7Operations = [
      {
        name: 'Red Mud Valorization',
        description: 'Utilizing red mud as byproduct',
        stage: 'stage7-valorization',
        metalTypes: ['Aluminium'],
        category: 'Valorization',
        gwp: 2.5,
        waterUsage: 100,
        wasteGenerated: 1,
        energyRequired: 15,
        recoveryRate: 85,
        icon: { name: 'Recycle', color: '#8B008B' }
      },
      {
        name: 'Spent Pot Lining (SPL)',
        description: 'Recycling spent pot lining material',
        stage: 'stage7-valorization',
        metalTypes: ['Aluminium'],
        category: 'Valorization',
        gwp: 3.8,
        waterUsage: 80,
        wasteGenerated: 1,
        energyRequired: 25,
        recoveryRate: 90,
        icon: { name: 'Recycle', color: '#8B008B' }
      },
      {
        name: 'Dross Recovery',
        description: 'Recovering metal from dross',
        stage: 'stage7-valorization',
        metalTypes: ['Aluminium', 'Copper'],
        category: 'Valorization',
        gwp: 5.2,
        waterUsage: 150,
        wasteGenerated: 2,
        energyRequired: 40,
        recoveryRate: 88,
        icon: { name: 'Droplet', color: '#8B008B' }
      },
      {
        name: 'Fluoride Gas Recovery',
        description: 'Capturing and recycling fluoride gases',
        stage: 'stage7-valorization',
        metalTypes: ['Aluminium'],
        category: 'Valorization',
        gwp: 1.5,
        waterUsage: 50,
        wasteGenerated: 0.5,
        energyRequired: 10,
        recoveryRate: 92,
        icon: { name: 'Wind', color: '#8B008B' }
      },
      {
        name: 'Slag Utilization',
        description: 'Using slag in construction materials',
        stage: 'stage7-valorization',
        metalTypes: ['Steel', 'Copper'],
        category: 'Valorization',
        gwp: 2.1,
        waterUsage: 75,
        wasteGenerated: 0.5,
        energyRequired: 12,
        recoveryRate: 95,
        icon: { name: 'Layers', color: '#8B008B' }
      },
      {
        name: 'Other Waste Valorization',
        description: 'Utilizing other waste streams',
        stage: 'stage7-valorization',
        metalTypes: ['universal'],
        category: 'Valorization',
        gwp: 1.8,
        waterUsage: 60,
        wasteGenerated: 0.5,
        energyRequired: 8,
        recoveryRate: 85,
        icon: { name: 'Recycle', color: '#8B008B' }
      }
    ];

    // Combine all operations
    const allOperations = [
      ...stage1Operations,
      ...stage2Operations,
      ...stage3aOperations,
      ...stage4Operations,
      ...stage5Operations,
      ...stage6Operations,
      ...stage7Operations
    ];

    // Insert operations
    const createdOperations = await Operation.insertMany(allOperations);

    console.log(`✓ Created ${createdOperations.length} operations\n`);

    // Summary by stage
    const stageNames = {
      'stage1-extraction': 'Stage 1: Extraction',
      'stage2-processing': 'Stage 2: Processing',
      'stage3a-alumina-refining': 'Stage 3A: Alumina Refining',
      'stage4-smelting': 'Stage 4: Smelting',
      'stage5-manufacturing': 'Stage 5: Manufacturing',
      'stage6-recycling': 'Stage 6: Recycling',
      'stage7-valorization': 'Stage 7: Valorization'
    };

    const stageGroups = {};
    createdOperations.forEach(op => {
      const stageName = stageNames[op.stage];
      if (!stageGroups[stageName]) stageGroups[stageName] = 0;
      stageGroups[stageName]++;
    });

    console.log('📊 Operations by Stage:');
    Object.entries(stageGroups).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count}`);
    });

    console.log('\n✓ Operations database seeded successfully\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedOperations();
