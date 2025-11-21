/**
 * Get User IDs from Database
 * 
 * This script retrieves all user IDs from MongoDB to use in Canvas API tests
 * 
 * Usage: node scripts/getUserIds.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');

async function getUserIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✓ MongoDB connected\n');

    const users = await User.find().select('_id name email role');
    
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                    USER IDs FOR CANVAS API TESTING                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ObjectId: ${user._id.toString()}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('📋 USE ANY OF THE ObjectId VALUES ABOVE IN YOUR POSTMAN REQUESTS\n');
    console.log('Example for Postman body:');
    console.log(JSON.stringify({
      userId: users[0]._id.toString(),
      name: 'My LCA Workflow',
      metalType: 'Aluminum',
      description: 'Testing canvas workflow'
    }, null, 2));

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

getUserIds();
