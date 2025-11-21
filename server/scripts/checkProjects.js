require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../src/models/Project');

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const projects = await Project.find().sort({createdAt: -1});
    console.log('\n=== TOTAL PROJECTS:', projects.length, '===\n');
    
    projects.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
      console.log(`   Metal: ${p.metalType}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Circularity: ${p.circularityScore}%`);
      console.log(`   Created: ${p.createdAt}`);
      console.log(`   Wizard ID: ${p.wizardWorkflowId || 'N/A'}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProjects();
