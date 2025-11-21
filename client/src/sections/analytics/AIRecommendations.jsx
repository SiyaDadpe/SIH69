import React, { useState } from 'react';
import { 
    AreaChart, Area, ScatterChart, Scatter, 
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, ZAxis 
} from 'recharts';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, TrendingUp, Target, Zap } from 'lucide-react';

export default function AIRecommendations({ mode, selectedProject }) {
    const [expandedStages, setExpandedStages] = useState({});
    const [selectedPriority, setSelectedPriority] = useState('all');

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view AI recommendations
            </div>
        );
    }

    // aiRecommendations is directly an array in the data structure
    const recommendations = selectedProject.aiRecommendations || [];

    const toggleStage = (stageId) => {
        setExpandedStages(prev => ({
            ...prev,
            [stageId]: !prev[stageId]
        }));
    };

    // Generate confidence color
    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return '#22C55E'; // High - green
        if (confidence >= 60) return '#F59E0B'; // Medium - orange
        return '#EF4444'; // Low - red
    };

    // Generate priority color
    const getPriorityColor = (priority) => {
        const colors = {
            critical: '#DC2626',
            high: '#F59E0B',
            medium: '#3B82F6',
            low: '#6B7280'
        };
        return colors[priority.toLowerCase()] || colors.medium;
    };

    // Generate implementation status icon
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'ready':
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'in-progress':
                return <Zap className="w-5 h-5 text-yellow-600" />;
            case 'planned':
                return <Target className="w-5 h-5 text-blue-600" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-600" />;
        }
    };

    // Mock implementation roadmap steps
    const generateRoadmapSteps = (recommendation) => {
        return [
            { phase: 'Assessment', duration: '2 weeks', status: 'completed', progress: 100 },
            { phase: 'Planning', duration: '3 weeks', status: 'completed', progress: 100 },
            { phase: 'Pilot Testing', duration: '6 weeks', status: 'in-progress', progress: 60 },
            { phase: 'Full Deployment', duration: '8 weeks', status: 'pending', progress: 0 },
            { phase: 'Optimization', duration: '4 weeks', status: 'pending', progress: 0 }
        ];
    };

    // Mock before/after impact data
    const generateImpactData = (recommendation) => {
        const baseline = 100;
        const improvement = recommendation.efficiencyImpact || 10;
        
        return [
            { month: 'Month 1', before: baseline, after: baseline },
            { month: 'Month 2', before: baseline, after: baseline + improvement * 0.2 },
            { month: 'Month 3', before: baseline, after: baseline + improvement * 0.4 },
            { month: 'Month 4', before: baseline, after: baseline + improvement * 0.6 },
            { month: 'Month 5', before: baseline, after: baseline + improvement * 0.8 },
            { month: 'Month 6', before: baseline, after: baseline + improvement }
        ];
    };

    // Priority matrix data (2D scatter plot)
    const priorityMatrixData = recommendations.map(rec => ({
        name: rec.title,
        impact: rec.emissionImpact ? Math.abs(rec.emissionImpact) : rec.efficiencyImpact || 50,
        effort: rec.complexity === 'low' ? 30 : rec.complexity === 'medium' ? 60 : 90,
        priority: rec.priority >= 4 ? 'high' : rec.priority >= 3 ? 'medium' : 'low',
        size: rec.efficiencyImpact || 10
    }));

    // Risk sensitivity data
    const riskData = [
        { 
            risk: 'Technology Maturity', 
            sensitivity: 'High', 
            mitigation: 'Phased rollout with pilot testing',
            probability: 65,
            impact: 80
        },
        { 
            risk: 'Capital Investment', 
            sensitivity: 'Medium', 
            mitigation: 'Secure financing, ROI analysis',
            probability: 45,
            impact: 70
        },
        { 
            risk: 'Operational Disruption', 
            sensitivity: 'Medium', 
            mitigation: 'Parallel operations during transition',
            probability: 55,
            impact: 60
        },
        { 
            risk: 'Skills Gap', 
            sensitivity: 'High', 
            mitigation: 'Training programs, external consultants',
            probability: 70,
            impact: 50
        },
        { 
            risk: 'Regulatory Compliance', 
            sensitivity: 'Low', 
            mitigation: 'Pre-approval engagement with authorities',
            probability: 25,
            impact: 85
        }
    ];

    // Circular economy pathways
    const circularPathways = [
        {
            category: 'Technology Adoption',
            items: [
                'Implement advanced scrap sorting using AI-powered vision systems',
                'Deploy real-time energy monitoring with predictive analytics',
                'Integrate blockchain for material traceability and circular supply chain',
                'Adopt digital twins for process optimization and predictive maintenance',
                'Implement IoT sensors for waste stream characterization'
            ]
        },
        {
            category: 'Waste Valorization',
            items: [
                'Convert red mud to construction materials (cement additives, bricks)',
                'Extract rare earth elements from bauxite residue',
                'Utilize SPL as soil amendment and agricultural application',
                'Generate revenue from carbon capture and utilization',
                'Develop market for secondary aluminum alloys from mixed scrap'
            ]
        },
        {
            category: 'Resource Efficiency',
            items: [
                'Closed-loop water recycling achieving 95% recovery rate',
                'Waste heat recovery for district heating or power generation',
                'By-product synergy with cement and steel industries',
                'Optimize material flows using industrial symbiosis principles',
                'Zero-waste-to-landfill target through comprehensive valorization'
            ]
        },
        {
            category: 'Circular Business Models',
            items: [
                'Product-as-a-service for aluminum components in key sectors',
                'Take-back schemes with deposit systems for aluminum products',
                'Circular procurement policies prioritizing recycled content',
                'Collaborative platforms for scrap trading and quality assurance',
                'Performance-based contracts incentivizing circular outcomes'
            ]
        }
    ];

    // Filter recommendations by priority
    const filteredRecommendations = selectedPriority === 'all' 
        ? recommendations 
        : recommendations.filter(rec => {
            // Map numeric priority to text (5=critical, 4=high, 3=medium, 2=low)
            const priorityText = rec.priority >= 5 ? 'critical' : rec.priority >= 4 ? 'high' : rec.priority >= 3 ? 'medium' : 'low';
            return priorityText === selectedPriority;
        });

    // Group recommendations by stage/category
    const stageGroups = filteredRecommendations.reduce((acc, rec) => {
        const stage = rec.category || rec.affectedStage || 'General';
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(rec);
        return acc;
    }, {});

    return (
        <div className="ai-recommendations space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Recommendations</h2>
                        <p className="text-gray-600">
                            {mode === 'circular' ? 'Circular economy optimization insights' : 'Linear process improvement opportunities'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#BA7967]">
                            {recommendations.length}
                        </div>
                        <div className="text-sm text-gray-600">Active Insights</div>
                    </div>
                </div>
            </div>

            {/* Priority Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Filter by Priority</h3>
                        <p className="text-xs text-gray-600">Focus on high-impact recommendations</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedPriority('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'all'
                                    ? 'bg-[#BA7967] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSelectedPriority('critical')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'critical'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Critical
                        </button>
                        <button
                            onClick={() => setSelectedPriority('high')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'high'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            High
                        </button>
                        <button
                            onClick={() => setSelectedPriority('medium')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'medium'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Medium
                        </button>
                    </div>
                </div>
            </div>

            {/* Stage-wise Recommendations (Accordion) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Stage-wise Optimization Opportunities</h3>
                
                {Object.entries(stageGroups).map(([stageName, stageRecs]) => (
                    <div key={stageName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => toggleStage(stageName)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#BA7967]/10 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-[#BA7967]" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-semibold text-gray-900">{stageName}</h4>
                                    <p className="text-sm text-gray-600">{stageRecs.length} recommendations</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-green-600">
                                        +{stageRecs.reduce((sum, rec) => sum + (rec.efficiencyImpact || 0), 0).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-600">Potential gain</div>
                                </div>
                                {expandedStages[stageName] ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </button>

                        {expandedStages[stageName] && (
                            <div className="border-t border-gray-200">
                                {stageRecs.map((rec, idx) => (
                                    <div key={idx} className="p-6 border-b border-gray-100 last:border-b-0">
                                        {/* Recommendation Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getStatusIcon(rec.complexity || 'planned')}
                                                    <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                                                    <span 
                                                        className="px-2 py-1 rounded text-xs font-medium text-white"
                                                        style={{ backgroundColor: getPriorityColor(
                                                            rec.priority >= 5 ? 'critical' : rec.priority >= 4 ? 'high' : rec.priority >= 3 ? 'medium' : 'low'
                                                        ) }}
                                                    >
                                                        {rec.priority >= 5 ? 'Critical' : rec.priority >= 4 ? 'High' : rec.priority >= 3 ? 'Medium' : 'Low'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 ml-8">{rec.description}</p>
                                            </div>
                                        </div>

                                        {/* Confidence Score */}
                                        <div className="mb-4 ml-8">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">AI Confidence Score</span>
                                                <span className="text-sm font-bold" style={{ color: getConfidenceColor(rec.confidenceScore) }}>
                                                    {rec.confidenceScore}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className="h-3 rounded-full transition-all duration-500"
                                                    style={{ 
                                                        width: `${rec.confidenceScore}%`,
                                                        backgroundColor: getConfidenceColor(rec.confidenceScore)
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Impact Projection Chart */}
                                        <div className="mb-4 ml-8">
                                            <h6 className="text-sm font-semibold text-gray-900 mb-3">
                                                Impact Projection: {rec.category}
                                            </h6>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <AreaChart data={generateImpactData(rec)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                    <XAxis 
                                                        dataKey="month" 
                                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                                        stroke="#9CA3AF"
                                                    />
                                                    <YAxis 
                                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                                        stroke="#9CA3AF"
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'white', 
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="before" 
                                                        stroke="#9CA3AF" 
                                                        fill="#E5E7EB" 
                                                        name="Current Performance"
                                                        strokeWidth={2}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="after" 
                                                        stroke="#22C55E" 
                                                        fill="#86EFAC" 
                                                        name="Projected Performance"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Implementation Roadmap */}
                                        <div className="mb-4 ml-8">
                                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Implementation Roadmap</h6>
                                            <div className="space-y-3">
                                                {generateRoadmapSteps(rec).map((step, stepIdx) => (
                                                    <div key={stepIdx} className="flex items-center gap-4">
                                                        {/* Step indicator */}
                                                        <div className="flex flex-col items-center">
                                                            <div 
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                                                    step.status === 'completed' 
                                                                        ? 'bg-green-500 text-white' 
                                                                        : step.status === 'in-progress'
                                                                        ? 'bg-yellow-500 text-white'
                                                                        : 'bg-gray-300 text-gray-600'
                                                                }`}
                                                            >
                                                                {stepIdx + 1}
                                                            </div>
                                                            {stepIdx < generateRoadmapSteps(rec).length - 1 && (
                                                                <div className="w-0.5 h-8 bg-gray-300 my-1" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* Step content */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-medium text-gray-900">{step.phase}</span>
                                                                <span className="text-xs text-gray-600">{step.duration}</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                                        step.status === 'completed' 
                                                                            ? 'bg-green-500' 
                                                                            : step.status === 'in-progress'
                                                                            ? 'bg-yellow-500'
                                                                            : 'bg-gray-300'
                                                                    }`}
                                                                    style={{ width: `${step.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 ml-8">
                                            <div className="p-3 bg-green-50 rounded-lg">
                                                <div className="text-xs text-gray-600">Efficiency Impact</div>
                                                <div className="text-lg font-bold text-green-700">
                                                    +{rec.efficiencyImpact || 0}%
                                                </div>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <div className="text-xs text-gray-600">Implementation Time</div>
                                                <div className="text-lg font-bold text-blue-700">
                                                    {rec.implementationTime || 12} mo
                                                </div>
                                            </div>
                                            <div className="p-3 bg-orange-50 rounded-lg">
                                                <div className="text-xs text-gray-600">Investment</div>
                                                <div className="text-lg font-bold text-orange-700">
                                                    ${(rec.implementationCost || 50000).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="p-3 bg-purple-50 rounded-lg">
                                                <div className="text-xs text-gray-600">Cost Impact</div>
                                                <div className="text-lg font-bold text-purple-700">
                                                    {rec.costImpact || 0}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Priority Matrix (2D Scatter Plot) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Matrix: Impact vs Effort</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Recommendations positioned by business impact and implementation effort. 
                    <span className="font-semibold"> Size indicates expected improvement percentage.</span>
                </p>
                <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                            type="number" 
                            dataKey="effort" 
                            name="Implementation Effort" 
                            unit="%"
                            domain={[0, 100]}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            stroke="#9CA3AF"
                            label={{ value: 'Implementation Effort →', position: 'insideBottom', offset: -10, fill: '#6B7280' }}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="impact" 
                            name="Business Impact" 
                            unit="%"
                            domain={[0, 100]}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            stroke="#9CA3AF"
                            label={{ value: 'Business Impact →', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                        />
                        <ZAxis type="number" dataKey="size" range={[100, 1000]} name="Expected Improvement" />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value, name) => {
                                if (name === 'Expected Improvement') return [`${value}%`, name];
                                return [`${value.toFixed(1)}%`, name];
                            }}
                        />
                        <Scatter name="Recommendations" data={priorityMatrixData}>
                            {priorityMatrixData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={getPriorityColor(entry.priority)}
                                    fillOpacity={0.7}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                
                {/* Matrix Quadrants Legend */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-semibold text-green-900">Quick Wins (Low Effort, High Impact)</div>
                        <div className="text-xs text-green-700 mt-1">Prioritize for immediate implementation</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-900">Strategic Projects (High Effort, High Impact)</div>
                        <div className="text-xs text-blue-700 mt-1">Plan carefully with adequate resources</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="font-semibold text-yellow-900">Fill-ins (Low Effort, Low Impact)</div>
                        <div className="text-xs text-yellow-700 mt-1">Implement when resources available</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="font-semibold text-red-900">Reconsider (High Effort, Low Impact)</div>
                        <div className="text-xs text-red-700 mt-1">Avoid unless strategic necessity</div>
                    </div>
                </div>
            </div>

            {/* Risk Dashboard */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk & Sensitivity Analysis</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Risk Factor</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Sensitivity</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Probability</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Impact</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Risk Score</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Mitigation Strategy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riskData.map((risk, idx) => {
                                const riskScore = (risk.probability * risk.impact) / 100;
                                const riskLevel = riskScore > 60 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';
                                const riskColor = riskScore > 60 ? '#EF4444' : riskScore > 40 ? '#F59E0B' : '#22C55E';
                                
                                return (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{risk.risk}</td>
                                        <td className="py-3 px-4">
                                            <span 
                                                className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                                    risk.sensitivity === 'High' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : risk.sensitivity === 'Medium'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}
                                            >
                                                {risk.sensitivity}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 w-20 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${risk.probability}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600 w-8">{risk.probability}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 w-20 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-orange-500 h-2 rounded-full"
                                                        style={{ width: `${risk.impact}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600 w-8">{risk.impact}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                                    style={{ backgroundColor: riskColor }}
                                                >
                                                    {riskScore.toFixed(0)}
                                                </div>
                                                <span className="text-xs font-medium" style={{ color: riskColor }}>
                                                    {riskLevel}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{risk.mitigation}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Circular Economy Pathways */}
            {mode === 'circular' && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-500 rounded-full">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Circular Economy Pathways</h3>
                            <p className="text-sm text-gray-600">Strategic initiatives for circularity transformation</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {circularPathways.map((pathway, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {pathway.category}
                                </h4>
                                <ul className="space-y-2">
                                    {pathway.items.map((item, itemIdx) => (
                                        <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Circular Economy Metrics */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-green-600">95%</div>
                            <div className="text-xs text-gray-600 mt-1">Material Circularity Rate</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-blue-600">68%</div>
                            <div className="text-xs text-gray-600 mt-1">Waste Valorization</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                            <div className="text-2xl font-bold text-purple-600">$2.4M</div>
                            <div className="text-xs text-gray-600 mt-1">Annual Value Recovery</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Total Implementation Cost</div>
                    <div className="text-2xl font-bold text-green-600">
                        ${recommendations.reduce((sum, rec) => sum + (rec.implementationCost || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Capital required</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Avg. Confidence Score</div>
                    <div className="text-2xl font-bold text-[#BA7967]">
                        {recommendations.length > 0 ? (recommendations.reduce((sum, rec) => sum + rec.confidenceScore, 0) / recommendations.length).toFixed(0) : 0}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">AI prediction accuracy</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Total Emission Reduction</div>
                    <div className="text-2xl font-bold text-orange-600">
                        {Math.abs(recommendations.reduce((sum, rec) => sum + (rec.emissionImpact || 0), 0)).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Environmental benefit</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Avg. Implementation Time</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {recommendations.length > 0 ? (recommendations.reduce((sum, rec) => sum + (rec.implementationTime || 12), 0) / recommendations.length).toFixed(0) : 0} mo
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Timeline</div>
                </div>
            </div>
        </div>
    );
}
