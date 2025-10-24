require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../src/models/Project');
const config = require('../src/config');

async function listProjects() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB\n');

    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total Projects: ${projects.length}\n`);

    if (projects.length === 0) {
      console.log('No projects found in database.');
    } else {
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   Metal Type: ${project.metalType}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Owner: ${project.owner?.name || project.owner?.email || project.owner}`);
        console.log(`   Circularity Score: ${project.circularityScore || 0}`);
        console.log(`   Created: ${new Date(project.createdAt).toLocaleString()}`);
        if (project.wizardWorkflowId) {
          console.log(`   ✨ Created from Wizard: ${project.wizardWorkflowId}`);
        }
        console.log('');
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listProjects();
