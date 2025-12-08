import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Color palette for professional report
const COLORS = {
  primary: [37, 99, 235],      // Blue-600
  secondary: [99, 102, 241],   // Indigo-500
  success: [22, 163, 74],      // Green-600
  warning: [245, 158, 11],     // Amber-500
  danger: [239, 68, 68],       // Red-500
  info: [14, 165, 233],        // Sky-500
  gray: {
    50: [249, 250, 251],
    100: [243, 244, 246],
    200: [229, 231, 235],
    300: [209, 213, 219],
    400: [156, 163, 175],
    500: [107, 114, 128],
    600: [75, 85, 99],
    700: [55, 65, 81],
    800: [31, 41, 55]
  }
};

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
  let pageNumber = 0;

  // Define stage names early for use in TOC
  const stages = lcaData.lcaStages || {};
  const stageNames = ['mining', 'beneficiation', 'smelting', 'refining', 'manufacturing', 'recycling', 'valorization'];
  const existingStagesCount = stageNames.filter(name => stages[name]).length;

  // Helper to extract value from {value, unit} format
  const getValue = (data) => {
    if (typeof data === 'object' && data !== null && 'value' in data) {
      return data.value;
    }
    return data;
  };

  // Helper to get full string with unit
  const getValueWithUnit = (data, defaultUnit = '') => {
    if (typeof data === 'object' && data !== null && 'value' in data && 'unit' in data) {
      const value = typeof data.value === 'number' ? data.value.toFixed(2) : data.value;
      return `${value} ${data.unit}`;
    }
    if (typeof data === 'number') {
      return defaultUnit ? `${data.toFixed(2)} ${defaultUnit}` : data.toFixed(2);
    }
    return String(data);
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
  const addSectionHeader = (title, color = COLORS.primary) => {
    checkNewPage(30);
    doc.setFillColor(...color);
    doc.roundedRect(10, yPos, pageWidth - 20, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 15, yPos + 8);
    doc.setTextColor(0, 0, 0);
    yPos += 18;
  };

  // Helper to add subsection header
  const addSubsectionHeader = (title) => {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.gray[700]);
    doc.text(title, 15, yPos);
    doc.setDrawColor(...COLORS.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  };

  // Helper to add metric card
  const addMetricCard = (label, value, x, y, width, color = COLORS.primary) => {
    doc.setFillColor(...COLORS.gray[50]);
    doc.roundedRect(x, y, width, 20, 2, 2, 'F');
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, 20, 2, 2, 'S');
    
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray[600]);
    doc.text(label, x + 3, y + 6);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...color);
    doc.text(value, x + 3, y + 14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
  };

  // Helper to get rating color
  const getRatingColor = (rating) => {
    const ratingMap = {
      'Excellent': COLORS.success,
      'Good': [34, 197, 94],
      'Fair': COLORS.warning,
      'Poor': COLORS.danger,
      'Very Poor': [220, 38, 38]
    };
    return ratingMap[rating] || COLORS.gray[600];
  };

  // Helper to draw a horizontal bar chart
  const drawBarChart = (title, data, startY, maxValue) => {
    const barHeight = 15;
    const maxBarWidth = pageWidth - 110;
    const spacing = 5;
    let chartY = startY;

    if (title) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...COLORS.gray[700]);
      doc.text(title, 20, chartY);
      chartY += 10;
    }

    data.forEach((item, index) => {
      checkNewPage(barHeight + spacing + 5);
      
      // Label
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...COLORS.gray[700]);
      doc.text(item.label, 22, chartY + 10);

      // Bar background
      doc.setFillColor(...COLORS.gray[100]);
      doc.roundedRect(85, chartY, maxBarWidth, barHeight, 2, 2, 'F');

      // Bar value
      const barWidth = maxValue > 0 ? (item.value / maxValue) * maxBarWidth : 0;
      const barColor = item.color || COLORS.primary;
      doc.setFillColor(...barColor);
      doc.roundedRect(85, chartY, Math.max(barWidth, 2), barHeight, 2, 2, 'F');

      // Value text
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      if (barWidth > 30) {
        doc.text(item.valueText || String(item.value), 90, chartY + 10);
      } else {
        doc.setTextColor(...COLORS.gray[700]);
        doc.text(item.valueText || String(item.value), 85 + barWidth + 5, chartY + 10);
      }

      chartY += barHeight + spacing;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    return chartY;
  };

  // ========== COVER PAGE ==========
  // Gradient background effect
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 100, 'F');
  doc.setFillColor(...COLORS.secondary);
  doc.triangle(0, 100, pageWidth, 80, pageWidth, 100, 'F');
  
  // Logo/Icon placeholder (decorative circle)
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 40, 15, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.setFontSize(20);
  doc.text('LCA', pageWidth / 2, 43, { align: 'center' });
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont(undefined, 'bold');
  doc.text('Life Cycle Assessment', pageWidth / 2, 75, { align: 'center' });
  doc.setFontSize(28);
  doc.text('Report', pageWidth / 2, 88, { align: 'center' });
  
  // Project name with decorative line
  doc.setFontSize(16);
  doc.setFont(undefined, 'normal');
  const projectName = lcaData.projectName || 'Environmental Impact Analysis';
  doc.text(projectName, pageWidth / 2, 115, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.setDrawColor(255, 255, 255);
  const textWidth = doc.getTextWidth(projectName);
  doc.line(pageWidth / 2 - textWidth / 2 - 10, 118, pageWidth / 2 + textWidth / 2 + 10, 118);
  
  // Date and metadata box
  doc.setFillColor(...COLORS.gray[50]);
  doc.roundedRect(30, 135, pageWidth - 60, 35, 3, 3, 'F');
  doc.setDrawColor(...COLORS.gray[300]);
  doc.roundedRect(30, 135, pageWidth - 60, 35, 3, 3, 'S');
  
  doc.setTextColor(...COLORS.gray[800]);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  
  const analysisDate = lcaData.analysisDate?.$date || lcaData.analysisDate || Date.now();
  const metadata = [
    { label: 'Analysis Date:', value: new Date(analysisDate).toLocaleDateString() },
    { label: 'Metal Type:', value: lcaData.metalType || 'N/A' },
    { label: 'Report Generated:', value: new Date().toLocaleDateString() }
  ];
  
  let metaY = 143;
  metadata.forEach(item => {
    doc.setFont(undefined, 'bold');
    doc.text(item.label, 40, metaY);
    doc.setFont(undefined, 'normal');
    doc.text(item.value, 40 + doc.getTextWidth(item.label) + 3, metaY);
    metaY += 8;
  });

  doc.setTextColor(0, 0, 0);
  
  // Footer with confidentiality notice
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray[600]);
  doc.text('Confidential - For internal use only', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  yPos = 185;

  // Add table of contents
  doc.addPage();
  yPos = 20;
  addSectionHeader('Table of Contents', COLORS.secondary);
  
  const tocItems = [
    { section: 'Executive Summary', page: '3' },
    { section: 'Key Performance Indicators', page: '3' },
    { section: 'Linear vs Circular Economy Comparison', page: '4' },
    { section: 'Process Stage Analytics', page: '5' },
    { section: 'Stage-wise Impact Distribution', page: (6 + existingStagesCount) },
    { section: 'Material Flow Analysis', page: (7 + existingStagesCount) },
    { section: 'Recommendations', page: (8 + existingStagesCount) }
  ];

  autoTable(doc, {
    startY: yPos,
    body: tocItems.map(item => [item.section, item.page]),
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 140 },
      1: { halign: 'right', cellWidth: 'auto' }
    },
    didDrawCell: (data) => {
      if (data.column.index === 0) {
        doc.setDrawColor(...COLORS.gray[200]);
        doc.setLineWidth(0.1);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    }
  });

  // ========== EXECUTIVE SUMMARY ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Executive Summary');

  // Key highlights box
  doc.setFillColor(...COLORS.info);
  doc.setFillColor(219, 234, 254); // Blue-100
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'F');
  doc.setDrawColor(...COLORS.info);
  doc.setLineWidth(1);
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray[700]);
  
  const summaryText = `This Life Cycle Assessment evaluates the environmental impact of ${lcaData.metalType || 'metal'} production, ` +
    `analyzing energy consumption, emissions, water usage, and waste generation across all lifecycle stages. ` +
    `The assessment provides actionable insights for improving sustainability and circularity performance.`;
  
  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 45);
  let summaryY = yPos + 8;
  summaryLines.forEach(line => {
    doc.text(line, 20, summaryY);
    summaryY += 6;
  });
  
  doc.setTextColor(0, 0, 0);
  yPos += 48;

  // Key Performance Indicators in cards
  addSubsectionHeader('Key Performance Indicators');
  
  const cardWidth = (pageWidth - 40) / 3;
  const cardSpacing = 5;
  
  // Row 1 - Environmental metrics
  addMetricCard('Total Energy', getValueWithUnit(lcaData.totalEnergyConsumption, 'MJ'), 
    15, yPos, cardWidth - cardSpacing, COLORS.primary);
  addMetricCard('CO₂ Emissions', getValueWithUnit(lcaData.totalCO2Emissions, 'kg CO₂e'), 
    15 + cardWidth, yPos, cardWidth - cardSpacing, COLORS.danger);
  addMetricCard('Water Usage', getValueWithUnit(lcaData.totalWaterUsage, 'm³'), 
    15 + cardWidth * 2, yPos, cardWidth - cardSpacing, COLORS.info);
  
  yPos += 28;
  
  // Row 2 - Impact metrics
  addMetricCard('Waste Generated', getValueWithUnit(lcaData.totalWasteGeneration, 'kg'), 
    15, yPos, cardWidth - cardSpacing, COLORS.warning);
  addMetricCard('Air Quality Impact', getValueWithUnit(lcaData.totalAirQualityImpact, 'kg'), 
    15 + cardWidth, yPos, cardWidth - cardSpacing, COLORS.secondary);
  addMetricCard('Energy Intensity', getValueWithUnit(lcaData.energyIntensity, 'MJ/kg'), 
    15 + cardWidth * 2, yPos, cardWidth - cardSpacing, COLORS.primary);
  
  yPos += 28;
  
  // Row 3 - Circularity metrics
  addMetricCard('Carbon Intensity', getValueWithUnit(lcaData.carbonIntensity, 'kg CO₂e/kg'), 
    15, yPos, cardWidth - cardSpacing, COLORS.danger);
  addMetricCard('Recovery Rate', getValueWithUnit(lcaData.materialRecoveryRate, '%'), 
    15 + cardWidth, yPos, cardWidth - cardSpacing, COLORS.success);
  addMetricCard('Circularity Index', getValueWithUnit(lcaData.circularityIndex, '%'), 
    15 + cardWidth * 2, yPos, cardWidth - cardSpacing, COLORS.success);
  
  yPos += 35;

  // Circularity Rating - Enhanced display
  checkNewPage(50);
  doc.setFillColor(240, 253, 244); // Green-50
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'F');
  
  const ratingColor = getRatingColor(lcaData.circularityRating);
  doc.setDrawColor(...ratingColor);
  doc.setLineWidth(2);
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.gray[700]);
  doc.text('Overall Circularity Assessment', 22, yPos + 12);
  
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...ratingColor);
  const rating = lcaData.circularityRating || 'Not Rated';
  doc.text(rating, 22, yPos + 28);
  
  // Circularity score badge
  doc.setFillColor(...ratingColor);
  doc.circle(pageWidth - 38, yPos + 20, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(String(getValue(lcaData.circularityScore) || 0), pageWidth - 38, yPos + 23, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  yPos += 50;

  // ========== LINEAR VS CIRCULAR ECONOMY COMPARISON ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Linear vs Circular Economy Impact', COLORS.secondary);

  // Calculate linear model (assuming no recycling/recovery)
  const totalEnergy = getValue(lcaData.totalEnergyConsumption) || 0;
  const totalCO2 = getValue(lcaData.totalCO2Emissions) || 0;
  const totalWater = getValue(lcaData.totalWaterUsage) || 0;
  const totalWaste = getValue(lcaData.totalWasteGeneration) || 0;
  const recoveryRate = getValue(lcaData.materialRecoveryRate) || 0;
  const circularityIndex = getValue(lcaData.circularityIndex) || 0;

  // Linear model assumption: 100% virgin material, no recovery
  const linearMultiplier = recoveryRate > 0 ? (100 / (100 - recoveryRate)) : 1.3;
  const linearEnergy = totalEnergy * linearMultiplier;
  const linearCO2 = totalCO2 * linearMultiplier;
  const linearWater = totalWater * linearMultiplier;
  const linearWaste = totalWaste * (recoveryRate > 0 ? 1.5 : 1.2);

  // Info box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray[700]);
  const comparisonText = `This comparison shows the environmental impact of your current system (with ${recoveryRate.toFixed(1)}% material recovery) ` +
    `versus a traditional linear economy model (0% recovery). Circular economy practices significantly reduce resource consumption and waste.`;
  const compLines = doc.splitTextToSize(comparisonText, pageWidth - 45);
  let compY = yPos + 8;
  compLines.forEach(line => {
    doc.text(line, 20, compY);
    compY += 5;
  });
  doc.setTextColor(0, 0, 0);
  yPos += 38;

  // Energy Comparison
  addSubsectionHeader('Energy Consumption Comparison');
  const energyData = [
    { 
      label: 'Linear Model', 
      value: linearEnergy, 
      valueText: `${linearEnergy.toFixed(2)} MJ`,
      color: COLORS.danger 
    },
    { 
      label: 'Current (Circular)', 
      value: totalEnergy, 
      valueText: `${totalEnergy.toFixed(2)} MJ`,
      color: COLORS.success 
    }
  ];
  yPos = drawBarChart('Energy Use', energyData, yPos, Math.max(linearEnergy, totalEnergy));
  
  // Savings calculation
  const energySavings = ((linearEnergy - totalEnergy) / linearEnergy * 100).toFixed(1);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(20, yPos + 5, pageWidth - 40, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.success);
  doc.text(`Energy Savings: ${energySavings}% (${(linearEnergy - totalEnergy).toFixed(2)} MJ)`, 25, yPos + 12);
  yPos += 22;

  // CO2 Comparison
  addSubsectionHeader('Carbon Emissions Comparison');
  const co2Data = [
    { 
      label: 'Linear Model', 
      value: linearCO2, 
      valueText: `${linearCO2.toFixed(2)} kg CO₂e`,
      color: COLORS.danger 
    },
    { 
      label: 'Current (Circular)', 
      value: totalCO2, 
      valueText: `${totalCO2.toFixed(2)} kg CO₂e`,
      color: COLORS.success 
    }
  ];
  yPos = drawBarChart('CO₂ Emissions', co2Data, yPos, Math.max(linearCO2, totalCO2));
  
  const co2Savings = ((linearCO2 - totalCO2) / linearCO2 * 100).toFixed(1);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(20, yPos + 5, pageWidth - 40, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.success);
  doc.text(`CO2 Emissions Reduced: ${co2Savings}% (${(linearCO2 - totalCO2).toFixed(2)} kg CO2e)`, 25, yPos + 12);
  yPos += 22;

  // Water Comparison
  checkNewPage(80);
  addSubsectionHeader('Water Usage Comparison');
  const waterData = [
    { 
      label: 'Linear Model', 
      value: linearWater, 
      valueText: `${linearWater.toFixed(2)} m³`,
      color: COLORS.danger 
    },
    { 
      label: 'Current (Circular)', 
      value: totalWater, 
      valueText: `${totalWater.toFixed(2)} m³`,
      color: COLORS.info 
    }
  ];
  yPos = drawBarChart('Water Consumption', waterData, yPos, Math.max(linearWater, totalWater));
  
  const waterSavings = ((linearWater - totalWater) / linearWater * 100).toFixed(1);
  doc.setFillColor(224, 242, 254);
  doc.roundedRect(20, yPos + 5, pageWidth - 40, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.info);
  doc.text(`Water Savings: ${waterSavings}% (${(linearWater - totalWater).toFixed(2)} m3)`, 25, yPos + 12);
  yPos += 22;

  // Waste Comparison
  addSubsectionHeader('Waste Generation Comparison');
  const wasteData = [
    { 
      label: 'Linear Model', 
      value: linearWaste, 
      valueText: `${linearWaste.toFixed(2)} kg`,
      color: COLORS.warning 
    },
    { 
      label: 'Current (Circular)', 
      value: totalWaste, 
      valueText: `${totalWaste.toFixed(2)} kg`,
      color: COLORS.success 
    }
  ];
  yPos = drawBarChart('Waste Generated', wasteData, yPos, Math.max(linearWaste, totalWaste));
  
  const wasteSavings = ((linearWaste - totalWaste) / linearWaste * 100).toFixed(1);
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(20, yPos + 5, pageWidth - 40, 10, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...COLORS.success);
  doc.text(`Waste Reduction: ${wasteSavings}% (${(linearWaste - totalWaste).toFixed(2)} kg)`, 25, yPos + 12);
  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // ========== PROCESS STAGE ANALYTICS ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Process Stage Analytics');

  // stages and stageNames already declared at top of function
  
  let stageIndex = 0;
  for (const stageName of stageNames) {
    const stage = stages[stageName];
    if (!stage) continue;

    if (stageIndex > 0) {
      checkNewPage(120);
      yPos += 5;
    }

    // Stage header with colored badge
    const stageColors = [COLORS.primary, COLORS.secondary, COLORS.info, COLORS.warning, COLORS.success, COLORS.danger, COLORS.secondary];
    const stageColor = stageColors[stageIndex % stageColors.length];
    
    doc.setFillColor(...stageColor);
    doc.roundedRect(15, yPos, pageWidth - 30, 12, 2, 2, 'F');
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${stageIndex + 1}. ${stageName.charAt(0).toUpperCase() + stageName.slice(1)} Stage`, 20, yPos + 8);
    doc.setTextColor(0, 0, 0);
    yPos += 18;

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
      head: [['Metric', 'Value']],
      body: stageMetrics,
      theme: 'grid',
      headStyles: { 
        fillColor: stageColor, 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'left'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // AI Predictions if available - Enhanced styling
    if (stage.aiPredictions) {
      checkNewPage(40);
      
      doc.setFillColor(250, 245, 255); // Purple-50
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 2, 2, 'F');
      doc.setDrawColor(...COLORS.secondary);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPos, pageWidth - 40, 35, 2, 2, 'S');
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...COLORS.secondary);
      doc.text('AI-Optimized Predictions', 25, yPos + 7);
      doc.setFont(undefined, 'normal');
      yPos += 13;

      const predictions = [
        ['Optimized Energy', getValueWithUnit(stage.aiPredictions.optimizedEnergy || stage.aiPredictions.optimizedEnergyConsumption)],
        ['Optimized CO₂', getValueWithUnit(stage.aiPredictions.optimizedCO2 || stage.aiPredictions.optimizedCO2Emissions)],
        ['Optimized Water', getValueWithUnit(stage.aiPredictions.optimizedWater || stage.aiPredictions.optimizedWaterUsage)],
        ['Optimized Waste', getValueWithUnit(stage.aiPredictions.optimizedWaste || stage.aiPredictions.optimizedWasteGeneration)]
      ];

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray[600]);
      let predY = yPos;
      predictions.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 30, predY);
        predY += 5;
      });

      doc.setTextColor(0, 0, 0);
      yPos += 27;
    } else {
      yPos += 5;
    }

    stageIndex++;
  }

  // ========== STAGE IMPACT COMPARISON ==========
  doc.addPage();
  yPos = 20;
  addSectionHeader('Stage-wise Environmental Impact Distribution');

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...COLORS.gray[700]);
  doc.text('This chart shows which lifecycle stages contribute most to environmental impact, helping identify', 20, yPos);
  doc.text('optimization opportunities and priority areas for improvement.', 20, yPos + 5);
  doc.setTextColor(0, 0, 0);
  yPos += 18;

  // Collect stage data for comparison
  const stageImpacts = [];
  for (const stageName of stageNames) {
    const stage = stages[stageName];
    if (!stage) continue;
    
    stageImpacts.push({
      name: stageName.charAt(0).toUpperCase() + stageName.slice(1),
      energy: getValue(stage.energyConsumption) || 0,
      co2: getValue(stage.co2Emissions) || 0,
      water: getValue(stage.waterUsage) || 0,
      waste: getValue(stage.wasteGeneration) || 0
    });
  }

  if (stageImpacts.length > 0) {
    // Energy by stage
    addSubsectionHeader('Energy Consumption by Stage');
    const maxEnergy = Math.max(...stageImpacts.map(s => s.energy));
    const energyByStage = stageImpacts.map(s => ({
      label: s.name,
      value: s.energy,
      valueText: `${s.energy.toFixed(2)} MJ`,
      color: COLORS.primary
    }));
    yPos = drawBarChart('', energyByStage, yPos, maxEnergy);
    yPos += 10;

    checkNewPage(80);

    // CO2 by stage
    addSubsectionHeader('CO₂ Emissions by Stage');
    const maxCO2 = Math.max(...stageImpacts.map(s => s.co2));
    const co2ByStage = stageImpacts.map(s => ({
      label: s.name,
      value: s.co2,
      valueText: `${s.co2.toFixed(2)} kg`,
      color: COLORS.danger
    }));
    yPos = drawBarChart('', co2ByStage, yPos, maxCO2);
    yPos += 10;

    checkNewPage(80);

    // Water by stage
    addSubsectionHeader('Water Usage by Stage');
    const maxWater = Math.max(...stageImpacts.map(s => s.water));
    const waterByStage = stageImpacts.map(s => ({
      label: s.name,
      value: s.water,
      valueText: `${s.water.toFixed(2)} m³`,
      color: COLORS.info
    }));
    yPos = drawBarChart('', waterByStage, yPos, maxWater);
    yPos += 10;

    // Find highest impact stages
    const highestEnergy = stageImpacts.reduce((max, s) => s.energy > max.energy ? s : max, stageImpacts[0]);
    const highestCO2 = stageImpacts.reduce((max, s) => s.co2 > max.co2 ? s : max, stageImpacts[0]);
    
    checkNewPage(40);
    doc.setFillColor(254, 243, 199); // Yellow-100
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
    doc.setDrawColor(...COLORS.warning);
    doc.setLineWidth(1);
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'S');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.warning);
    doc.text('Key Findings:', 20, yPos + 10);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...COLORS.gray[700]);
    doc.text(`- Highest energy consumer: ${highestEnergy.name} (${highestEnergy.energy.toFixed(2)} MJ)`, 22, yPos + 19);
    doc.text(`- Highest CO2 emitter: ${highestCO2.name} (${highestCO2.co2.toFixed(2)} kg CO2e)`, 22, yPos + 27);
    doc.setTextColor(0, 0, 0);
    yPos += 43;
  }

  // ========== SANKEY DIAGRAM DATA ==========
  if (lcaData.sankeyData && lcaData.sankeyData.nodes && lcaData.sankeyData.nodes.length > 0) {
    doc.addPage();
    yPos = 20;
    addSectionHeader('Material Flow Analysis');

    // Normalization info box
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.roundedRect(15, yPos, pageWidth - 30, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.gray[700]);
    doc.text('Normalization Basis: ' + (lcaData.sankeyData.normalizationBasisTonnes || 1) + ' tonne(s)', 20, yPos + 8);
    doc.setTextColor(0, 0, 0);
    yPos += 20;

    // Visual Sankey Diagram
    addSubsectionHeader('Material Flow Diagram');
    
    const nodes = lcaData.sankeyData.nodes;
    const links = lcaData.sankeyData.links;
    
    // Calculate positions for nodes in a vertical layout
    const nodeHeight = 15;
    const nodeWidth = 60;
    const startX = 30;
    const spacing = 8;
    const diagramStartY = yPos;
    
    // Draw nodes and collect their positions
    const nodePositions = [];
    nodes.forEach((node, index) => {
      const nodeY = diagramStartY + (index * (nodeHeight + spacing));
      nodePositions.push({ x: startX, y: nodeY, width: nodeWidth, height: nodeHeight });
      
      // Draw node box
      doc.setFillColor(...COLORS.primary);
      doc.setFillColor(59, 130, 246); // Blue-500
      doc.roundedRect(startX, nodeY, nodeWidth, nodeHeight, 2, 2, 'F');
      
      // Node label
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      const nodeText = node.length > 12 ? node.substring(0, 10) + '..' : node;
      doc.text(nodeText, startX + nodeWidth / 2, nodeY + nodeHeight / 2 + 2, { align: 'center' });
    });
    
    doc.setTextColor(0, 0, 0);
    
    // Draw flows with arrows and values
    const flowStartX = startX + nodeWidth + 5;
    const maxFlow = Math.max(...links.map(l => l.value), 1);
    
    links.forEach((link, index) => {
      const sourcePos = nodePositions[link.source];
      const targetPos = nodePositions[link.target];
      
      if (sourcePos && targetPos) {
        const fromY = sourcePos.y + sourcePos.height / 2;
        const toY = targetPos.y + targetPos.height / 2;
        const arrowX = flowStartX + 40;
        
        // Draw flow line (curved if different levels)
        const flowThickness = Math.max(1, (link.value / maxFlow) * 5);
        doc.setLineWidth(flowThickness);
        doc.setDrawColor(...COLORS.success);
        
        if (Math.abs(fromY - toY) < 5) {
          // Straight line for same level
          doc.line(flowStartX, fromY, arrowX, fromY);
        } else {
          // Curved line for different levels
          const midX = (flowStartX + arrowX) / 2;
          doc.line(flowStartX, fromY, midX, fromY);
          doc.line(midX, fromY, midX, toY);
          doc.line(midX, toY, arrowX, toY);
        }
        
        // Draw arrowhead
        doc.setFillColor(...COLORS.success);
        const arrowSize = 2;
        doc.triangle(
          arrowX, toY,
          arrowX - arrowSize, toY - arrowSize,
          arrowX - arrowSize, toY + arrowSize,
          'F'
        );
        
        // Flow value label
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...COLORS.gray[700]);
        const labelY = Math.min(fromY, toY) + Math.abs(fromY - toY) / 2;
        doc.text(`${link.value.toFixed(2)} t`, flowStartX + 20, labelY - 2);
      }
    });
    
    doc.setLineWidth(0.5);
    doc.setTextColor(0, 0, 0);
    yPos = diagramStartY + (nodes.length * (nodeHeight + spacing)) + 15;
    
    checkNewPage(60);

    // Material Flows Table (detailed breakdown)
    addSubsectionHeader('Detailed Flow Data');

    const flowData = links.map(link => {
      const sourceName = nodes[link.source];
      const targetName = nodes[link.target];
      return [
        sourceName,
        targetName,
        link.value.toFixed(3) + ' t',
        ((link.value / links.reduce((sum, l) => sum + l.value, 0)) * 100).toFixed(1) + '%'
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['From Stage', 'To Stage', 'Flow Amount', '% of Total']],
      body: flowData,
      theme: 'grid',
      headStyles: { 
        fillColor: COLORS.info, 
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { halign: 'right', fontStyle: 'bold', textColor: COLORS.success },
        3: { halign: 'right', textColor: COLORS.info }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
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
      checkNewPage(40);
      
      // Recommendation card
      const cardHeight = 35;
      const priorityColors = {
        'High': COLORS.danger,
        'Medium': COLORS.warning,
        'Low': COLORS.info
      };
      const recColor = priorityColors[rec.priority] || COLORS.gray[400];
      
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.roundedRect(15, yPos, pageWidth - 30, cardHeight, 2, 2, 'F');
      doc.setDrawColor(...recColor);
      doc.setLineWidth(2);
      doc.line(15, yPos, 15, yPos + cardHeight); // Left border accent
      
      // Number badge
      doc.setFillColor(...recColor);
      doc.circle(22, yPos + 10, 5, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(String(index + 1), 22, yPos + 12, { align: 'center' });
      
      // Title
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.gray[800]);
      doc.text(rec.title || 'Recommendation', 32, yPos + 11);
      
      // Description
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...COLORS.gray[600]);
      const lines = doc.splitTextToSize(rec.description || rec.text || 'No description', pageWidth - 50);
      let descY = yPos + 18;
      lines.slice(0, 2).forEach(line => { // Limit to 2 lines in card
        doc.text(line, 20, descY);
        descY += 5;
      });
      
      // Impact badge
      if (rec.impact) {
        doc.setFillColor(...COLORS.success);
        doc.setFillColor(220, 252, 231); // Green-100
        doc.roundedRect(pageWidth - 80, yPos + 5, 60, 8, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...COLORS.success);
        doc.text(`Impact: ${rec.impact}`, pageWidth - 77, yPos + 10);
      }
      
      doc.setTextColor(0, 0, 0);
      yPos += cardHeight + 8;
    });
  }

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray[400]);
    
    // Footer line
    doc.setDrawColor(...COLORS.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
    
    // Footer text
    doc.text(
      `Generated by LCA Platform | ${new Date().toLocaleDateString()}`,
      20,
      pageHeight - 10
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );
  }
  doc.setTextColor(0, 0, 0);

  // ========== SAVE PDF ==========
  const filename = `${lcaData.projectName || 'LCA-Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
