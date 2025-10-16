/**
 * Mock Data Generator
 * Generates sample insights and benchmarks for testing
 */

/**
 * Generate mock insights for a project
 */
const generateMockInsights = (projectId) => {
  const insightTypes = [
    'energy-efficiency',
    'material-optimization',
    'waste-reduction',
    'emission-hotspot',
    'benchmark-comparison',
    'regulatory-compliance',
    'cost-saving',
    'circular-opportunity'
  ];

  const priorities = ['low', 'medium', 'high', 'critical'];

  const templates = [
    {
      type: 'energy-efficiency',
      titles: [
        'Optimize Energy Consumption in Smelting Process',
        'Switch to Renewable Energy Sources',
        'Implement Heat Recovery System'
      ],
      descriptions: [
        'Analysis shows potential 25% reduction in energy usage by optimizing furnace temperature cycles.',
        'Transitioning to solar power could reduce carbon footprint by 40% annually.',
        'Installing a heat recovery system could save up to 30% on heating costs.'
      ]
    },
    {
      type: 'material-optimization',
      titles: [
        'Reduce Scrap Metal Waste',
        'Improve Alloy Composition Efficiency',
        'Optimize Raw Material Sourcing'
      ],
      descriptions: [
        'Current scrap rate is 15% above industry average. Implementing precision cutting could reduce this by 40%.',
        'Adjusting alloy ratios could improve strength while reducing rare material usage by 20%.',
        'Sourcing recycled materials locally could cut costs by 18% and reduce transport emissions.'
      ]
    },
    {
      type: 'waste-reduction',
      titles: [
        'Implement Zero-Waste Initiative',
        'Recycle Process Water',
        'Repurpose By-Products'
      ],
      descriptions: [
        'Installing a closed-loop water system could eliminate 90% of water waste.',
        'Slag and other by-products can be sold to construction industry, generating additional revenue.',
        'Implementing waste sorting could recover 60% of currently discarded materials.'
      ]
    },
    {
      type: 'emission-hotspot',
      titles: [
        'Address High CO2 Emissions in Refining Stage',
        'Reduce VOC Emissions from Coating Process',
        'Minimize Particulate Matter Release'
      ],
      descriptions: [
        'Refining stage accounts for 65% of total emissions. Catalyst upgrade could reduce this by 35%.',
        'Installing carbon capture technology could offset 500 tons of CO2 annually.',
        'Upgrading filtration systems could reduce particulate emissions by 80%.'
      ]
    },
    {
      type: 'circular-opportunity',
      titles: [
        'Create Closed-Loop Material Flow',
        'Partner with Recycling Networks',
        'Implement Product Take-Back Program'
      ],
      descriptions: [
        'Establishing partnerships with 5 local recyclers could ensure 95% material circularity.',
        'A take-back program could recover 70% of end-of-life products for reprocessing.',
        'Designing for disassembly could increase recyclability rate from 60% to 90%.'
      ]
    },
    {
      type: 'cost-saving',
      titles: [
        'Reduce Energy Costs Through Optimization',
        'Lower Material Costs with Bulk Purchasing',
        'Decrease Waste Disposal Expenses'
      ],
      descriptions: [
        'Energy monitoring system could identify savings of $50,000 annually.',
        'Negotiating bulk contracts could reduce material costs by 12%.',
        'Waste reduction initiatives could save $30,000 in disposal fees yearly.'
      ]
    }
  ];

  const insights = [];
  const numInsights = Math.floor(Math.random() * 3) + 3; // 3-5 insights

  for (let i = 0; i < numInsights; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const titleIndex = Math.floor(Math.random() * template.titles.length);
    
    insights.push({
      type: template.type,
      title: template.titles[titleIndex],
      description: template.descriptions[titleIndex],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      confidenceScore: Math.floor(Math.random() * 20) + 80, // 80-100
      relatedProjectId: projectId,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    });
  }

  return insights;
};

/**
 * Generate mock benchmark data
 */
const generateMockBenchmark = (userCircularityScore) => {
  const industryMedian = 65;
  const industryAverage = 62;
  const topPerformer = 92;
  
  // Calculate user's percentile based on their score
  let percentile;
  if (userCircularityScore >= 90) percentile = 95;
  else if (userCircularityScore >= 80) percentile = 85;
  else if (userCircularityScore >= 70) percentile = 70;
  else if (userCircularityScore >= 60) percentile = 55;
  else if (userCircularityScore >= 50) percentile = 40;
  else percentile = 25;

  return {
    userAverageCircularity: userCircularityScore,
    industryMedianCircularity: industryMedian,
    industryAverageCircularity: industryAverage,
    topPerformerCircularity: topPerformer,
    userPercentile: percentile,
    comparison: {
      vsMedian: userCircularityScore - industryMedian,
      vsAverage: userCircularityScore - industryAverage,
      vsTopPerformer: userCircularityScore - topPerformer
    },
    recommendations: userCircularityScore < industryMedian 
      ? ['Focus on increasing material recycling rates', 'Implement closed-loop systems', 'Reduce virgin material usage']
      : ['Maintain current performance', 'Explore advanced circular strategies', 'Share best practices'],
    sectorBreakdown: {
      mining: 45,
      manufacturing: 68,
      recycling: 85,
      remanufacturing: 78
    },
    regionalComparison: {
      asia: 58,
      europe: 72,
      northAmerica: 65,
      global: industryMedian
    },
    lastUpdated: new Date()
  };
};

/**
 * Get industry insights (general recommendations not tied to a project)
 */
const getIndustryInsights = () => {
  return [
    {
      type: 'regulatory-compliance',
      title: 'New EU Circular Economy Regulations Coming in 2026',
      description: 'Prepare for stricter material traceability and recycled content requirements. Companies should start implementing digital material passports.',
      priority: 'high',
      confidenceScore: 95,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'benchmark-comparison',
      title: 'Industry Average Circularity Score Increased to 65%',
      description: 'The metal industry has improved its average circularity score by 5% this year, driven by increased recycling rates and better material recovery.',
      priority: 'medium',
      confidenceScore: 90,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'circular-opportunity',
      title: 'Growing Market for Recycled Aluminum',
      description: 'Demand for recycled aluminum has increased 30% YoY. Consider expanding recycling operations to capitalize on this trend.',
      priority: 'medium',
      confidenceScore: 88,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];
};

module.exports = {
  generateMockInsights,
  generateMockBenchmark,
  getIndustryInsights
};
