/**
 * LCA Report PDF Generator
 * 
 * Generates formatted PDF reports for Life Cycle Assessment analysis results
 * using PDFKit library.
 * 
 * @module utils/generateLCAReport
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get circularity rating description
 * @param {number} score - Circularity score
 * @returns {string} Rating description
 */
function getCircularityRating(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Fair';
  if (score >= 25) return 'Poor';
  return 'Very Poor';
}

/**
 * Draw a horizontal separator line
 * @param {PDFDocument} doc - PDF document
 */
function drawSeparator(doc) {
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke('#cccccc');
  doc.moveDown(0.5);
}

/**
 * Draw a thick section separator
 * @param {PDFDocument} doc - PDF document
 */
function drawThickSeparator(doc) {
  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .lineWidth(2)
    .stroke('#333333');
  doc.lineWidth(1);
  doc.moveDown(0.5);
}

/**
 * Add section header
 * @param {PDFDocument} doc - PDF document
 * @param {string} title - Section title
 */
function addSectionHeader(doc, title) {
  doc.moveDown(1);
  drawThickSeparator(doc);
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#2c3e50')
    .text(title.toUpperCase(), { align: 'center' });
  drawThickSeparator(doc);
  doc.moveDown(0.5);
  doc.fillColor('#000000');
}

/**
 * Add metric row with label and value
 * @param {PDFDocument} doc - PDF document
 * @param {string} label - Metric label
 * @param {string|number} value - Metric value
 * @param {number} indent - Indentation level
 */
function addMetricRow(doc, label, value, indent = 0) {
  const x = 70 + (indent * 20);
  const labelWidth = 350;
  
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#333333')
    .text(label, x, doc.y, { width: labelWidth, continued: false });
  
  const valueX = x + labelWidth;
  doc
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(value, valueX, doc.y - 10, { align: 'right', width: doc.page.width - valueX - 70 });
  
  doc.moveDown(0.3);
}

/**
 * Add impact category section
 * @param {PDFDocument} doc - PDF document
 * @param {string} icon - Emoji icon
 * @param {string} title - Category title
 * @param {Array} metrics - Array of metrics {label, value, unit}
 */
function addImpactCategory(doc, icon, title, metrics) {
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#2980b9')
    .text(`${icon} ${title}`, 70);
  
  doc.moveDown(0.3);
  
  metrics.forEach(metric => {
    const valueStr = `${formatNumber(metric.value)} ${metric.unit}`;
    addMetricRow(doc, `  ${metric.label}`, valueStr, 0);
  });
  
  doc.moveDown(0.5);
  drawSeparator(doc);
}

/**
 * Add recommendations section
 * @param {PDFDocument} doc - PDF document
 * @param {Array} recommendations - Array of recommendations
 */
function addRecommendations(doc, recommendations) {
  addSectionHeader(doc, 'Recommendations');
  
  if (!recommendations || recommendations.length === 0) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('No specific recommendations available.', 70);
    return;
  }

  recommendations.forEach((rec, index) => {
    const priorityColors = {
      HIGH: '#e74c3c',
      MEDIUM: '#f39c12',
      LOW: '#3498db'
    };

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(priorityColors[rec.priority] || '#333333')
      .text(`[${rec.priority}] `, 70, doc.y, { continued: true })
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(rec.title);
    
    if (rec.description) {
      doc
        .moveDown(0.2)
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(rec.description, 90);
    }
    
    doc.moveDown(0.5);
  });
}

/**
 * Generate LCA Analysis Summary Report PDF
 * @param {Object} lcaData - LCA calculation data
 * @param {string} outputPath - Path to save the PDF
 * @returns {Promise<Object>} Report information {path, filename, size}
 */
async function generateLCAReport(lcaData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'LCA Analysis Summary Report',
          Author: 'LCA Platform',
          Subject: 'Life Cycle Assessment',
          Keywords: 'LCA, Sustainability, Aluminum, Environmental Impact'
        }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // ============================================================================
      // HEADER
      // ============================================================================
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text('LCA ANALYSIS SUMMARY REPORT', { align: 'center' });
      
      doc.moveDown(0.5);
      drawThickSeparator(doc);
      doc.moveDown(1);

      // Project Information
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#34495e')
        .text('Project:', 70, doc.y, { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(` ${lcaData.projectName || 'Aluminum Production'}`);
      
      doc
        .font('Helvetica-Bold')
        .fillColor('#34495e')
        .text('Location:', 70, doc.y, { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(` ${lcaData.location || 'Not specified'}`);
      
      const analysisDate = lcaData.analysisDate 
        ? new Date(lcaData.analysisDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      doc
        .font('Helvetica-Bold')
        .fillColor('#34495e')
        .text('Analysis Date:', 70, doc.y, { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(` ${analysisDate}`);

      // ============================================================================
      // OVERALL IMPACT SUMMARY
      // ============================================================================
      addSectionHeader(doc, 'Overall Impact Summary');

      addMetricRow(doc, 'Total Energy Consumption:', `${formatNumber(lcaData.totalEnergyConsumption || 0)} MJ`);
      addMetricRow(doc, 'Total CO₂ Emissions:', `${formatNumber(lcaData.totalCO2Emissions || 0)} kg CO₂e`);
      addMetricRow(doc, 'Total Water Usage:', `${formatNumber(lcaData.totalWaterUsage || 0)} m³`);
      addMetricRow(doc, 'Total Waste Generation:', `${formatNumber(lcaData.totalWasteGeneration || 0)} kg`);
      
      doc.moveDown(0.5);
      drawSeparator(doc);
      doc.moveDown(0.5);

      addMetricRow(doc, 'Energy Intensity:', `${formatNumber(lcaData.energyIntensity || 0)} MJ/kg aluminum`);
      addMetricRow(doc, 'Carbon Intensity:', `${formatNumber(lcaData.carbonIntensity || 0)} kg CO₂e/kg aluminum`);
      
      doc.moveDown(0.5);
      drawSeparator(doc);
      doc.moveDown(0.5);

      const circularityScore = lcaData.circularityScore || 0;
      const circularityRating = getCircularityRating(circularityScore);
      
      addMetricRow(doc, 'Circularity Score:', `${formatNumber(circularityScore, 1)}% (${circularityRating})`);
      addMetricRow(doc, 'Material Recovery Rate:', `${formatNumber(lcaData.materialRecoveryRate || 0, 1)}%`);

      // ============================================================================
      // IMPACT BREAKDOWN BY CATEGORY
      // ============================================================================
      addSectionHeader(doc, 'Impact Breakdown by Category');

      // Energy Consumption
      addImpactCategory(doc, '⚡', 'Energy Consumption', [
        { label: 'Total Energy Used', value: lcaData.totalEnergyConsumption || 0, unit: 'MJ' },
        { label: 'Energy Intensity', value: lcaData.energyIntensity || 0, unit: 'MJ/kg' }
      ]);

      // Carbon Emissions
      addImpactCategory(doc, '🌍', 'Carbon Emissions', [
        { label: 'Total CO₂ Emissions', value: lcaData.totalCO2Emissions || 0, unit: 'kg CO₂e' },
        { label: 'Carbon Intensity', value: lcaData.carbonIntensity || 0, unit: 'kg CO₂e/kg' }
      ]);

      // Water Usage
      addImpactCategory(doc, '💧', 'Water Usage', [
        { label: 'Total Water Consumed', value: lcaData.totalWaterUsage || 0, unit: 'm³' }
      ]);

      // Waste Generation
      addImpactCategory(doc, '♻', 'Waste Generation', [
        { label: 'Total Waste Generated', value: lcaData.totalWasteGeneration || 0, unit: 'kg' },
        { label: 'Material Recovery Rate', value: lcaData.materialRecoveryRate || 0, unit: '%' }
      ]);

      // Air Quality
      if (lcaData.totalAirQualityImpact) {
        addImpactCategory(doc, '💨', 'Air Quality', [
          { label: 'Total Air Quality Impact', value: lcaData.totalAirQualityImpact || 0, unit: 'kg pollutants' }
        ]);
      }

      // ============================================================================
      // STAGE-WISE BREAKDOWN
      // ============================================================================
      if (lcaData.stageData && lcaData.stageData.length > 0) {
        // Check if we need a new page
        if (doc.y > 600) {
          doc.addPage();
        }

        addSectionHeader(doc, 'Stage-wise Impact Analysis');

        lcaData.stageData.forEach(stage => {
          if (!stage.completed) return; // Skip incomplete stages

          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#16a085')
            .text(stage.stageName.charAt(0).toUpperCase() + stage.stageName.slice(1), 70);
          
          doc.moveDown(0.2);

          if (stage.energyConsumption) {
            addMetricRow(doc, '  Energy:', `${formatNumber(stage.energyConsumption)} MJ`, 1);
          }
          if (stage.co2Emissions) {
            addMetricRow(doc, '  CO₂:', `${formatNumber(stage.co2Emissions)} kg CO₂e`, 1);
          }
          if (stage.waterUsage) {
            addMetricRow(doc, '  Water:', `${formatNumber(stage.waterUsage)} m³`, 1);
          }
          if (stage.wasteGeneration) {
            addMetricRow(doc, '  Waste:', `${formatNumber(stage.wasteGeneration)} kg`, 1);
          }
          
          doc.moveDown(0.3);
          drawSeparator(doc);
        });
      }

      // ============================================================================
      // RECOMMENDATIONS
      // ============================================================================
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      addRecommendations(doc, lcaData.recommendations);

      // ============================================================================
      // FOOTER
      // ============================================================================
      drawThickSeparator(doc);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#7f8c8d')
        .text(
          'Generated by LCA Platform | © 2025 | This report is confidential',
          50,
          doc.page.height - 80,
          { align: 'center', width: doc.page.width - 100 }
        );

      // Finalize PDF
      doc.end();

      // Wait for write stream to finish
      writeStream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        resolve({
          path: outputPath,
          filename: path.basename(outputPath),
          size: stats.size
        });
      });

      writeStream.on('error', (error) => {
        reject(new Error(`Failed to write PDF: ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Failed to generate PDF: ${error.message}`));
    }
  });
}

/**
 * Generate filename for LCA report
 * @param {string} userId - User ID
 * @param {string} projectName - Project name
 * @returns {string} Filename
 */
function generateFilename(userId, projectName = 'report') {
  const timestamp = Date.now();
  const sanitizedProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 50);
  return `lca_report_${sanitizedProject}_${userId}_${timestamp}.pdf`;
}

module.exports = {
  generateLCAReport,
  generateFilename
};
