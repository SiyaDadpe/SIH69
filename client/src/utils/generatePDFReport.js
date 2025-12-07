import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a comprehensive LCA PDF report from calculatelca data
 * @param {Object} lcaData - The calculatelca document data
 * @returns {Promise<void>} - Downloads the PDF
 */
export const generateLCAPDFReport = async (lcaData) => {
  console.log('🔍 [PDF Generator] Starting PDF generation with data:', lcaData);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper to extract value from {value, unit} format
  const getValue = (data) => {
    if (typeof data === 'object' && data !== null && 'value' in data) {
      return data.value;
    }
    return data;
  };

  // Helper to get full string with unit
  const getValueWithUnit = (data) => {
    if (typeof data === 'object' && data !== null && 'value' in data && 'unit' in data) {
      return `${data.value.toFixed(2)} ${data.unit}`;
    }
    return typeof data === 'number' ? data.toFixed(2) : String(data);
  };

  // Helper to check if we need a new page
  const checkNewPage = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper to add section header
  const addSectionHeader = (title) => {
    checkNewPage(30);
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(10, yPos, pageWidth - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 15, yPos + 7);
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  };

  // ========== COVER PAGE ==========
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('Life Cycle Assessment Report', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'normal');
  doc.text(lcaData.projectName || 'LCA Analysis', pageWidth / 2, 50, { align: 'center' });
  
  doc.setFontSize(12);
  const analysisDate = lcaData.analysisDate?.$date || lcaData.analysisDate || Date.now();
  doc.text(new Date(analysisDate).toLocaleDateString(), pageWidth / 2, 65, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 100;

  // Project Information
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Project Information', 15, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  const projectInfo = [
    ['Project Name', lcaData.projectName || 'N/A'],
    ['Location', lcaData.location || 'N/A'],
    ['Metal Type', lcaData.metalType || 'N/A'],
    ['Analysis Date', new Date(analysisDate).toLocaleDateString()],
    ['Report Generated', new Date().toLocaleDateString()]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: projectInfo,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 10 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ========== EXECUTIVE SUMMARY ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Executive Summary - Key Metrics');

  const metrics = [
    ['Total Energy Consumption', getValueWithUnit(lcaData.totalEnergyConsumption)],
    ['Total CO₂ Emissions', getValueWithUnit(lcaData.totalCO2Emissions)],
    ['Total Water Usage', getValueWithUnit(lcaData.totalWaterUsage)],
    ['Total Waste Generation', getValueWithUnit(lcaData.totalWasteGeneration)],
    ['Total Air Quality Impact', getValueWithUnit(lcaData.totalAirQualityImpact)],
    ['Energy Intensity', getValueWithUnit(lcaData.energyIntensity)],
    ['Carbon Intensity', getValueWithUnit(lcaData.carbonIntensity)],
    ['Circularity Score', getValueWithUnit(lcaData.circularityScore)],
    ['Material Recovery Rate', getValueWithUnit(lcaData.materialRecoveryRate)],
    ['Circularity Index', getValueWithUnit(lcaData.circularityIndex)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metrics,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Circularity Rating Box
  checkNewPage(40);
  doc.setFillColor(220, 252, 231); // Green-100
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Circularity Rating:', 20, yPos + 10);
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74); // Green-600
  doc.text(lcaData.circularityRating || 'N/A', 20, yPos + 20);
  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // ========== PROCESS STAGE ANALYTICS ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Process Stage Analytics');

  const stages = lcaData.lcaStages || {};
  const stageNames = ['mining', 'beneficiation', 'smelting', 'refining', 'manufacturing', 'recycling', 'valorization'];
  
  for (const stageName of stageNames) {
    const stage = stages[stageName];
    if (!stage) continue;

    checkNewPage(60);

    // Stage title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(stageName.charAt(0).toUpperCase() + stageName.slice(1) + ' Stage', 15, yPos);
    yPos += 8;

    // Stage metrics table
    const stageMetrics = [
      ['Energy Consumption', getValueWithUnit(stage.energyConsumption)],
      ['CO₂ Emissions', getValueWithUnit(stage.co2Emissions)],
      ['Water Usage', getValueWithUnit(stage.waterUsage)],
      ['Waste Generation', getValueWithUnit(stage.wasteGeneration)],
      ['Air Quality Impact', getValueWithUnit(stage.airQualityImpact)]
    ];

    autoTable(doc, {
      startY: yPos,
      body: stageMetrics,
      theme: 'plain',
      margin: { left: 25, right: 15 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 3;

    // AI Predictions if available
    if (stage.aiPredictions) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(147, 51, 234); // Purple-600
      doc.text('AI Predictions:', 25, yPos);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      const predictions = [
        ['Optimized Energy', getValueWithUnit(stage.aiPredictions.optimizedEnergy || stage.aiPredictions.optimizedEnergyConsumption)],
        ['Optimized CO₂', getValueWithUnit(stage.aiPredictions.optimizedCO2 || stage.aiPredictions.optimizedCO2Emissions)],
        ['Optimized Water', getValueWithUnit(stage.aiPredictions.optimizedWater || stage.aiPredictions.optimizedWaterUsage)],
        ['Optimized Waste', getValueWithUnit(stage.aiPredictions.optimizedWaste || stage.aiPredictions.optimizedWasteGeneration)]
      ];

      autoTable(doc, {
        startY: yPos,
        body: predictions,
        theme: 'plain',
        margin: { left: 35, right: 15 },
        styles: { fontSize: 8, cellPadding: 1.5, textColor: [147, 51, 234] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' }
        }
      });

      yPos = doc.lastAutoTable.finalY + 8;
    } else {
      yPos += 10;
    }
  }

  // ========== SANKEY DIAGRAM DATA ==========
  if (lcaData.sankeyData && lcaData.sankeyData.nodes && lcaData.sankeyData.nodes.length > 0) {
    doc.addPage();
    yPos = 20;
    addSectionHeader('Material Flow Analysis');

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Normalization Basis: ' + (lcaData.sankeyData.normalizationBasisTonnes || 1) + ' tonne(s)', 15, yPos);
    yPos += 10;

    // Nodes
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Process Nodes:', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    lcaData.sankeyData.nodes.forEach((node, index) => {
      checkNewPage(8);
      doc.text(`${index + 1}. ${node}`, 20, yPos);
      yPos += 6;
    });

    yPos += 5;
    checkNewPage(40);

    // Links/Flows
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Material Flows:', 15, yPos);
    yPos += 8;

    const flowData = lcaData.sankeyData.links.map(link => {
      const sourceName = lcaData.sankeyData.nodes[link.source];
      const targetName = lcaData.sankeyData.nodes[link.target];
      return [
        sourceName,
        targetName,
        link.value.toFixed(3) + ' t'
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['From', 'To', 'Flow']],
      body: flowData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 },
        2: { cellWidth: 'auto', halign: 'right' }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // ========== RECOMMENDATIONS ==========
  if (lcaData.recommendations && lcaData.recommendations.length > 0) {
    doc.addPage();
    yPos = 20;
    addSectionHeader('Recommendations');

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    lcaData.recommendations.forEach((rec, index) => {
      checkNewPage(25);
      
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${rec.title || 'Recommendation'}`, 15, yPos);
      yPos += 6;

      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(rec.description || rec.text || 'No description', pageWidth - 30);
      lines.forEach(line => {
        checkNewPage(8);
        doc.text(line, 20, yPos);
        yPos += 5;
      });

      if (rec.impact) {
        doc.setTextColor(22, 163, 74);
        doc.text(`Impact: ${rec.impact}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }

      yPos += 5;
    });
  }

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by LCA Platform | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // ========== SAVE PDF ==========
  const filename = `${lcaData.projectName || 'LCA-Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
