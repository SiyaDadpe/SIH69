/**
 * Test PDF Export Functionality
 * 
 * This script tests the PDF export feature by making an HTTP request
 * to the export endpoint and saving the PDF file locally.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

// Use one of the seeded report IDs (you can get this from the seed script output)
// Replace with an actual report ID from your database
const REPORT_ID = '68f79d9ed6107314f723d94a'; // Aluminum report from seed

const OUTPUT_DIR = path.join(__dirname, '../test-exports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `test-report-${Date.now()}.pdf`);

console.log('\n🧪 Testing PDF Export Feature\n');
console.log('Configuration:');
console.log(`  Server: http://${HOST}:${PORT}`);
console.log(`  Report ID: ${REPORT_ID}`);
console.log(`  Output: ${OUTPUT_FILE}\n`);

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('✅ Created output directory\n');
}

// Make HTTP request
const options = {
  hostname: HOST,
  port: PORT,
  path: `/api/reports/${REPORT_ID}/export?format=pdf`,
  method: 'GET',
  headers: {
    'Accept': 'application/pdf'
  }
};

console.log('📡 Making request to export endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Response Status: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log(`Content-Disposition: ${res.headers['content-disposition']}\n`);

  if (res.statusCode === 200 && res.headers['content-type'] === 'application/pdf') {
    const fileStream = fs.createWriteStream(OUTPUT_FILE);
    
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      const stats = fs.statSync(OUTPUT_FILE);
      console.log('✅ PDF Export Successful!\n');
      console.log('File Details:');
      console.log(`  Path: ${OUTPUT_FILE}`);
      console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`  Created: ${stats.birthtime.toLocaleString()}\n`);
      console.log('💡 Open the PDF file to verify the content and formatting.\n');
      process.exit(0);
    });

    fileStream.on('error', (err) => {
      console.error('❌ Error writing PDF file:', err.message);
      process.exit(1);
    });
  } else if (res.statusCode === 404) {
    console.error('❌ Report not found');
    console.error('   Make sure to run the seed script first: npm run seed:reports\n');
    process.exit(1);
  } else {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.error('❌ PDF Export Failed\n');
      console.error('Response body:', body);
      process.exit(1);
    });
  }
});

req.on('error', (err) => {
  console.error('❌ Request Error:', err.message);
  console.error('\n💡 Make sure the server is running: npm start\n');
  process.exit(1);
});

req.setTimeout(30000, () => {
  console.error('❌ Request timeout (30s)');
  req.destroy();
  process.exit(1);
});

req.end();
