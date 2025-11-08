/**
 * Clean up duplicate workflows
 * Removes duplicate workflows created on the same day for the same user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { WizardWorkflow } = require('../src/models');

async function cleanupDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all workflows grouped by user and creation date
    const workflows = await WizardWorkflow.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total workflows: ${workflows.length}\n`);

    // Group workflows by userId and date
    const grouped = {};
    workflows.forEach(wf => {
      const date = new Date(wf.createdAt).toDateString();
      const key = `${wf.userId}_${date}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(wf);
    });

    // Find duplicates
    let duplicatesFound = 0;
    const toDelete = [];

    for (const [key, group] of Object.entries(grouped)) {
      if (group.length > 1) {
        duplicatesFound++;
        console.log(`\n🔍 Found ${group.length} workflows for ${key}:`);
        
        // Sort by createdAt, keep the oldest (first created)
        group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        console.log(`   ✅ Keeping: ${group[0]._id} (${new Date(group[0].createdAt).toLocaleTimeString()})`);
        
        // Mark the rest for deletion
        for (let i = 1; i < group.length; i++) {
          console.log(`   ❌ Will delete: ${group[i]._id} (${new Date(group[i].createdAt).toLocaleTimeString()})`);
          toDelete.push(group[i]._id);
        }
      }
    }

    if (toDelete.length === 0) {
      console.log('\n✨ No duplicates found! Database is clean.');
      await mongoose.disconnect();
      console.log('\n👋 Disconnected from MongoDB');
      process.exit(0);
    }

    console.log(`\n\n📋 Summary:`);
    console.log(`   • Duplicate groups found: ${duplicatesFound}`);
    console.log(`   • Total workflows to delete: ${toDelete.length}`);
    
    // Auto-delete duplicates (keep oldest, remove newer)
    const result = await WizardWorkflow.deleteMany({
      _id: { $in: toDelete }
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} duplicate workflows`);
    console.log('🎉 Cleanup completed!');
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupDuplicates();
