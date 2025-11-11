/**
 * Insight Controller
 * 
 * Manages AI-generated insights and recommendations for sustainability projects.
 */

const asyncHandler = require('express-async-handler');
const { Insight, Project } = require('../models');

/**
 * @desc    Get all insights with pagination and filtering
 * @route   GET /api/insights
 * @access  Private
 */
const getInsights = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    priority,
    projectId,
    sort = '-createdAt'
  } = req.query;

  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin';

  console.log('[INFO]', `Fetching insights for user: ${userId}`, { page, limit, type, priority });

  // Build filter
  const filter = {};

  // Users only see insights for their projects or global insights
  const userProjects = await Project.find({ userId: userId }).select('_id').lean();
  const projectIds = userProjects.map(p => p._id);
  
  filter.$or = [
    { relatedProjectId: { $in: projectIds } },
    { relatedProjectId: { $exists: false } } // Global insights
  ];

  // Apply optional filters
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (projectId) filter.relatedProjectId = projectId;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Execute query
  const [insights, totalInsights] = await Promise.all([
    Insight.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('relatedProjectId', 'name metalType processType circularityScore status')
      .lean(),
    Insight.countDocuments(filter)
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalInsights / limitNum);
  const currentPage = parseInt(page);

  console.log('[INFO]', `Retrieved ${insights.length} insights for user: ${userId}`);

  res.status(200).json({
    success: true,
    data: {
      insights,
      pagination: {
        currentPage,
        totalPages,
        totalInsights,
        insightsPerPage: limitNum,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
      }
    }
  });
});

/**
 * @desc    Get single insight by ID
 * @route   GET /api/insights/:id
 * @access  Private
 */
const getInsightById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin';

  console.log('[INFO]', `Fetching insight: ${id} for user: ${userId}`);

  const insight = await Insight.findById(id)
    .populate('relatedProjectId', 'name metalType processType circularityScore status owner')
    .lean();

  if (!insight) {
    console.warn('[WARN]', `Insight not found: ${id}`);
    return res.status(404).json({
      success: false,
      message: 'Insight not found'
    });
  }

  // Check authorization (admin or owner of related project)
  if (!isAdmin && insight.relatedProjectId) {
    const project = insight.relatedProjectId;
    if (project.owner.toString() !== userId.toString()) {
      console.warn('[WARN]', `Unauthorized access to insight: ${id} by user: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission to view this insight.'
      });
    }
  }

  console.log('[INFO]', `Insight retrieved successfully: ${id}`);

  res.status(200).json({
    success: true,
    data: { insight }
  });
});

/**
 * @desc    Create new insight (Admin only)
 * @route   POST /api/insights
 * @access  Private/Admin
 */
const createInsight = asyncHandler(async (req, res) => {
  const {
    type,
    title,
    description,
    confidenceScore,
    relatedProjectId,
    action,
    priority
  } = req.body;

  console.log('[INFO]', `Creating insight by admin: ${req.user._id}`, { type, priority });

  // Validate related project if provided
  if (relatedProjectId) {
    const project = await Project.findById(relatedProjectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Related project not found'
      });
    }
  }

  // Create insight
  const insight = await Insight.create({
    type,
    title,
    description,
    confidenceScore,
    relatedProjectId: relatedProjectId || undefined,
    action: action || {},
    priority
  });

  // Populate related project
  await insight.populate('relatedProjectId', 'name metalType processType');

  console.log('[INFO]', `Insight created successfully: ${insight._id}`);

  res.status(201).json({
    success: true,
    message: 'Insight created successfully',
    data: { insight }
  });
});

/**
 * @desc    Generate AI insights for a project
 * @route   POST /api/insights/generate-mock
 * @access  Private (Project owner or admin)
 */
const generateMockInsights = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user._id;

  console.log('[INFO]', `Generating insights for project: ${projectId}`);

  // Fetch project
  const project = await Project.findById(projectId)
    .populate('owner', 'name email organization');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check authorization (owner or admin)
  const isOwner = project.owner._id.toString() === userId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    console.warn('[WARN]', `Unauthorized insight generation attempt for project: ${projectId} by user: ${userId}`);
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Only the project owner or admin can generate insights.'
    });
  }

  // =========================================================================
  // Generate insights synchronously (fast rule-based algorithm)
  // =========================================================================
  
  try {
    await generateMockInsightsForProject({ projectId });
    
    console.log('[INFO]', `Insights generated successfully`, {
      projectId,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Insights generated successfully.',
      data: {
        project: {
          id: projectId,
          name: project.name,
          circularityScore: project.circularityScore,
          gwp: project.gwp
        },
        message: 'Check the insights list for newly generated recommendations.'
      }
    });
  } catch (error) {
    console.error('[ERROR]', 'Insight generation failed', {
      projectId,
      error: error.message
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to generate insights. Please try again.',
      error: error.message
    });
  }
});

/**
 * @desc    Delete insight (Admin only)
  // MOCK AI RULES - Replace with ML microservice
  // =========================================================================
  
  const generatedInsights = [];
  const {
    circularityScore,
    gwp,
    metalType,
    processType,
    metadata = {}
  } = project;

  // Rule 1: Low Circularity Score
  if (circularityScore < 50) {
    const targetScore = Math.min(circularityScore + 20, 75);
    const confidenceScore = 0.85 - (circularityScore / 100) * 0.2; // Higher confidence for lower scores
    
    generatedInsights.push({
      type: 'circular-opportunity',
      title: 'Low Circularity Score Detected',
      description: `Your project's circularity score of ${circularityScore.toFixed(1)}% is below industry standards. ` +
        `Increasing recycled content and improving material recovery could raise your score to ${targetScore.toFixed(1)}%.`,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      relatedProjectId: projectId,
      action: {
        recommendation: 'Increase recycled material content',
        targetMetric: 'circularityScore',
        currentValue: circularityScore,
        targetValue: targetScore,
        steps: [
          'Audit current material sources',
          'Identify suppliers of recycled materials',
          'Implement material tracking system',
          'Set recycled content targets (50%+)'
        ],
        estimatedImpact: `+${(targetScore - circularityScore).toFixed(1)}% circularity score`
      },
      priority: circularityScore < 30 ? 'critical' : 'high'
    });
  }

  // Rule 2: High GWP (Global Warming Potential)
  if (gwp > 2000) {
    const reductionPotential = gwp * 0.15; // 15% reduction potential
    const targetGWP = gwp - reductionPotential;
    const confidenceScore = 0.78;

    generatedInsights.push({
      type: 'emission-hotspot',
      title: 'High Carbon Emissions Detected',
      description: `Your project has a GWP of ${gwp.toFixed(2)} kg CO2-eq, which is above recommended levels. ` +
        `Energy efficiency improvements could reduce emissions by approximately ${reductionPotential.toFixed(2)} kg CO2-eq.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Implement energy efficiency measures',
        targetMetric: 'gwp',
        currentValue: gwp,
        targetValue: targetGWP,
        steps: [
          'Conduct energy audit',
          'Upgrade to energy-efficient equipment',
          'Optimize process temperatures',
          'Consider renewable energy sources'
        ],
        estimatedImpact: `-${reductionPotential.toFixed(2)} kg CO2-eq (15% reduction)`
      },
      priority: gwp > 3000 ? 'high' : 'medium'
    });
  }

  // Rule 3: Process-Specific Recommendations
  if (processType.toLowerCase().includes('hot rolling') || processType.toLowerCase().includes('heating')) {
    const confidenceScore = 0.72;

    generatedInsights.push({
      type: 'energy-efficiency',
      title: 'Heat Recovery Opportunity',
      description: `${processType} processes generate significant waste heat. ` +
        `Implementing heat recovery systems could improve energy efficiency by 10-15%.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Install heat recovery equipment',
        targetMetric: 'energyEfficiency',
        currentValue: null,
        targetValue: null,
        steps: [
          'Measure waste heat temperatures',
          'Design heat recovery system',
          'Install heat exchangers',
          'Monitor energy savings'
        ],
        estimatedImpact: '10-15% energy cost reduction'
      },
      priority: 'medium'
    });
  }

  // Rule 4: Material-Specific Recommendations
  if (metalType.toLowerCase().includes('steel')) {
    const currentRecycledContent = metadata.recycledContent || 0;
    
    if (currentRecycledContent < 30) {
      const targetRecycledContent = 50;
      const confidenceScore = 0.81;

      generatedInsights.push({
        type: 'material-optimization',
        title: 'Increase Steel Recycled Content',
        description: `Steel production with higher recycled content (scrap) has significantly lower environmental impact. ` +
          `Target: ${targetRecycledContent}% recycled content (current: ${currentRecycledContent}%).`,
        confidenceScore,
        relatedProjectId: projectId,
        action: {
          recommendation: 'Use Electric Arc Furnace (EAF) with scrap steel',
          targetMetric: 'recycledContent',
          currentValue: currentRecycledContent,
          targetValue: targetRecycledContent,
          steps: [
            'Source certified scrap steel',
            'Partner with EAF steel producers',
            'Update material specifications',
            'Verify recycled content certificates'
          ],
          estimatedImpact: `Up to 70% reduction in GWP compared to virgin steel`
        },
        priority: 'high'
      });
    }
  }

  // Rule 5: Aluminum-Specific Recommendations
  if (metalType.toLowerCase().includes('aluminum') || metalType.toLowerCase().includes('aluminium')) {
    const confidenceScore = 0.76;

    generatedInsights.push({
      type: 'material-optimization',
      title: 'Aluminum Recycling Opportunity',
      description: `Recycled aluminum requires only 5% of the energy needed for primary production. ` +
        `Maximizing recycled aluminum content offers substantial environmental benefits.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Maximize recycled aluminum content',
        targetMetric: 'recycledContent',
        currentValue: metadata.recycledContent || 0,
        targetValue: 80,
        steps: [
          'Source post-consumer aluminum scrap',
          'Implement closed-loop recycling',
          'Design for disassembly',
          'Partner with recycling facilities'
        ],
        estimatedImpact: '95% reduction in energy consumption vs primary aluminum'
      },
      priority: 'high'
    });
  }

  // Rule 6: Waste Reduction (if metadata indicates waste)
  if (metadata.wasteGenerated && metadata.wasteGenerated > 100) {
    const wasteReductionTarget = metadata.wasteGenerated * 0.7; // 30% reduction
    const confidenceScore = 0.68;

    generatedInsights.push({
      type: 'waste-reduction',
      title: 'High Waste Generation',
      description: `Your project generates ${metadata.wasteGenerated} kg of waste. ` +
        `Implementing waste reduction strategies could decrease waste by 30%.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Implement lean manufacturing and waste segregation',
        targetMetric: 'wasteGenerated',
        currentValue: metadata.wasteGenerated,
        targetValue: wasteReductionTarget,
        steps: [
          'Conduct waste audit',
          'Implement waste segregation',
          'Identify recycling opportunities',
          'Optimize material usage'
        ],
        estimatedImpact: `Reduce waste by ${(metadata.wasteGenerated - wasteReductionTarget).toFixed(2)} kg`
      },
      priority: 'medium'
    });
  }

  // Rule 7: Benchmark Comparison (if below median)
  if (circularityScore < 65) {
    const confidenceScore = 0.74;

    generatedInsights.push({
      type: 'benchmark-comparison',
      title: 'Below Industry Median',
      description: `Your circularity score of ${circularityScore.toFixed(1)}% is below the industry median of 65%. ` +
        `Review best practices from top performers to identify improvement opportunities.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Benchmark against industry leaders',
        targetMetric: 'circularityScore',
        currentValue: circularityScore,
        targetValue: 65,
        steps: [
          'Join industry benchmarking program',
          'Identify top performers in your sector',
          'Analyze their best practices',
          'Implement proven strategies'
        ],
        estimatedImpact: `Potential to reach industry median (65%)`
      },
      priority: 'medium'
    });
  }

  // Rule 8: Cost Saving Opportunity (high GWP = high energy cost)
  if (gwp > 2500) {
    const estimatedEnergyCost = gwp * 0.05; // Rough estimate: $0.05 per kg CO2-eq
    const potentialSavings = estimatedEnergyCost * 0.20; // 20% savings
    const confidenceScore = 0.65;

    generatedInsights.push({
      type: 'cost-saving',
      title: 'Energy Cost Reduction Opportunity',
      description: `High GWP correlates with high energy consumption. ` +
        `Energy optimization could save approximately $${potentialSavings.toFixed(2)} per production cycle.`,
      confidenceScore,
      relatedProjectId: projectId,
      action: {
        recommendation: 'Implement energy management system',
        targetMetric: 'energyCost',
        currentValue: estimatedEnergyCost,
        targetValue: estimatedEnergyCost - potentialSavings,
        steps: [
          'Install energy monitoring equipment',
          'Identify energy-intensive processes',
          'Optimize equipment operation',
          'Consider demand response programs'
        ],
        estimatedImpact: `$${potentialSavings.toFixed(2)} annual savings potential`
      },
      priority: 'low'
    });
  }

  // =========================================================================
  // Save generated insights to database
  // =========================================================================

  if (generatedInsights.length === 0) {
    console.log('[INFO]', `No insights generated for project: ${projectId} (project performing well)`);
    return res.status(200).json({
      success: true,
      message: 'No significant improvement opportunities identified. Project is performing well!',
      data: {
        insights: [],
        summary: {
          projectId,
          circularityScore,
          gwp,
          status: 'optimal'
        }
      }
    });
  }

  // Bulk insert insights
  const savedInsights = await Insight.insertMany(generatedInsights);

  console.log('[INFO]', `Generated ${savedInsights.length} mock AI insights for project: ${projectId}`);

  res.status(201).json({
    success: true,
    message: `Generated ${savedInsights.length} AI insights (mock rule-based)`,
    data: {
      insights: savedInsights,
      summary: {
        projectId,
        insightsGenerated: savedInsights.length,
        highPriority: savedInsights.filter(i => i.priority === 'high' || i.priority === 'critical').length,
        avgConfidenceScore: parseFloat(
          (savedInsights.reduce((sum, i) => sum + i.confidenceScore, 0) / savedInsights.length).toFixed(2)
        ),
        mockImplementation: true,
        note: 'These insights are generated using rule-based heuristics. Production system will use ML models.'
      }
    }
  });
/**
 * @desc    Delete insight (Admin only)
 * @route   DELETE /api/insights/:id
 * @access  Private/Admin
 */
const deleteInsight = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[INFO]', `Deleting insight: ${id} by admin: ${req.user._id}`);

  const insight = await Insight.findById(id);

  if (!insight) {
    return res.status(404).json({
      success: false,
      message: 'Insight not found'
    });
  }

  await insight.deleteOne();

  console.log('[INFO]', `Insight deleted successfully: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Insight deleted successfully',
    data: {
      deletedInsightId: id,
      deletedInsightTitle: insight.title
    }
  });
});

module.exports = {
  getInsights,
  getInsightById,
  createInsight,
  generateMockInsights,
  deleteInsight
};
