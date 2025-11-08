

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SankeyDiagram from '../../components/SankeyDiagram';

export default function ExecutiveSummary({ mode, selectedProject }) {
    const [sankeyMode, setSankeyMode] = useState(mode);
    const [selectedNode, setSelectedNode] = useState(null);
    
    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view the executive summary
            </div>
        );
    }

    const linearData = selectedProject.linearModel || {};
    const circularData = selectedProject.circularModel || {};
    const aiRecommendations = selectedProject.aiRecommendations || [];
    const comparativeMetrics = selectedProject.comparativeMetrics || {};
    const productionStages = selectedProject.productionStages || [];

    // Use actual data from comparativeMetrics for timeline projections
    const timelineData = [
        { year: 'Year 1', linear: linearData.totalCost * 0.2, circular: circularData.totalCost * 0.3 },
        { year: 'Year 2', linear: linearData.totalCost * 0.4, circular: circularData.totalCost * 0.5 },
        { year: 'Year 3', linear: linearData.totalCost * 0.7, circular: circularData.totalCost * 0.75 },
        { year: 'Year 4', linear: linearData.totalCost * 0.9, circular: circularData.totalCost * 0.95 },
        { year: 'Year 5', linear: linearData.totalCost, circular: circularData.totalCost }
    ];

    // Use actual emissions data for GWP timeline
    const gwpTimelineData = [
        { year: 'Year 1', linear: comparativeMetrics.carbonFootprint?.linear * 0.95 || linearData.totalEmissions * 0.95, circular: comparativeMetrics.carbonFootprint?.circular * 0.9 || circularData.totalEmissions * 0.9 },
        { year: 'Year 2', linear: comparativeMetrics.carbonFootprint?.linear * 0.9 || linearData.totalEmissions * 0.9, circular: comparativeMetrics.carbonFootprint?.circular * 0.75 || circularData.totalEmissions * 0.75 },
        { year: 'Year 3', linear: comparativeMetrics.carbonFootprint?.linear * 0.85 || linearData.totalEmissions * 0.85, circular: comparativeMetrics.carbonFootprint?.circular * 0.6 || circularData.totalEmissions * 0.6 },
        { year: 'Year 4', linear: comparativeMetrics.carbonFootprint?.linear * 0.82 || linearData.totalEmissions * 0.82, circular: comparativeMetrics.carbonFootprint?.circular * 0.5 || circularData.totalEmissions * 0.5 },
        { year: 'Year 5', linear: comparativeMetrics.carbonFootprint?.linear || linearData.totalEmissions, circular: comparativeMetrics.carbonFootprint?.circular || circularData.totalEmissions }
    ];

    const currentData = mode === 'linear' ? linearData : circularData;

    // Calculate implementation timeline phases based on actual implementationTimeline data
    const totalMonths = circularData.implementationTimeline || 24;
    const phaseConfig = [
        { phase: 'Planning', percentage: 0.15, status: 'completed' },
        { phase: 'Infrastructure', percentage: 0.30, status: 'completed' },
        { phase: 'Implementation', percentage: 0.35, status: 'in-progress' },
        { phase: 'Optimization', percentage: 0.12, status: 'pending' },
        { phase: 'Scale-up', percentage: 0.08, status: 'pending' }
    ];
    
    const timelinePhases = phaseConfig.map(config => ({
        phase: config.phase,
        status: config.status,
        duration: `${Math.round(totalMonths * config.percentage)} months`
    }));

    // Calculate metrics from actual data
    const costSavings = linearData.totalCost - circularData.totalCost;
    const gwpReduction = comparativeMetrics.carbonFootprint?.reduction || 
        ((linearData.totalEmissions - circularData.totalEmissions) / linearData.totalEmissions * 100);
    const waterSavings = comparativeMetrics.waterUsage?.reduction || 
        ((linearData.waterConsumption - circularData.waterConsumption) / linearData.waterConsumption * 100);
    const recyclingRate = circularData.recyclingRate || 0;
    const circularityIndex = circularData.materialCircularity || 0;

    // Generate Sankey diagram data from production stages
    const generateSankeyData = (stages, flowMode) => {
        if (!stages || stages.length === 0) {
            return { nodes: [], links: [] };
        }

        const nodes = [];
        const links = [];

        if (flowMode === 'linear') {
            // Linear flow: Input → Process → Output → Waste
            const totalInput = stages.reduce((sum, s) => sum + s.materialInput, 0);
            const totalOutput = stages.reduce((sum, s) => sum + s.productOutput, 0);
            const totalWaste = stages.reduce((sum, s) => sum + s.wasteOutput, 0);
            const totalEmissions = stages.reduce((sum, s) => sum + s.emissions, 0);

            nodes.push(
                { id: 'raw-material', name: 'Raw Materials', value: totalInput, column: 0, type: 'input', unit: 't' },
                { id: 'processing', name: 'Processing', value: totalInput, column: 1, type: 'process', unit: 't' },
                { id: 'products', name: 'Products', value: totalOutput, column: 2, type: 'output', unit: 't' },
                { id: 'waste', name: 'Waste', value: totalWaste, column: 2, type: 'waste', unit: 't' },
                { id: 'emissions', name: 'Emissions', value: totalEmissions / 100, column: 2, type: 'waste', unit: 'kg' }
            );

            links.push(
                { source: 'raw-material', target: 'processing', value: totalInput },
                { source: 'processing', target: 'products', value: totalOutput },
                { source: 'processing', target: 'waste', value: totalWaste },
                { source: 'processing', target: 'emissions', value: totalEmissions / 100 }
            );
        } else {
            // Circular flow: Input → Process → Output → Recycling → Back to Input
            const totalInput = stages.reduce((sum, s) => sum + s.materialInput, 0);
            const totalOutput = stages.reduce((sum, s) => sum + s.productOutput, 0);
            const totalWaste = stages.reduce((sum, s) => sum + s.wasteOutput, 0);
            const totalRecycled = totalOutput * (circularData.recyclingRate / 100);
            const totalEmissions = stages.reduce((sum, s) => sum + s.emissions, 0);
            const byProducts = stages.reduce((sum, s) => sum + (s.byProducts || 0), 0);

            nodes.push(
                { id: 'raw-material', name: 'Raw Materials', value: totalInput - totalRecycled, column: 0, type: 'input', unit: 't' },
                { id: 'recycled', name: 'Recycled Input', value: totalRecycled, column: 0, type: 'input', unit: 't' },
                { id: 'processing', name: 'Processing', value: totalInput, column: 1, type: 'process', unit: 't' },
                { id: 'products', name: 'Products', value: totalOutput, column: 2, type: 'output', unit: 't' },
                { id: 'byproducts', name: 'By-Products', value: byProducts, column: 2, type: 'output', unit: 't' },
                { id: 'recycling', name: 'Recycling', value: totalRecycled, column: 3, type: 'process', unit: 't' },
                { id: 'waste', name: 'Residual Waste', value: totalWaste * 0.2, column: 2, type: 'waste', unit: 't' },
                { id: 'emissions', name: 'Emissions', value: totalEmissions / 100, column: 2, type: 'waste', unit: 'kg' }
            );

            links.push(
                { source: 'raw-material', target: 'processing', value: totalInput - totalRecycled },
                { source: 'recycled', target: 'processing', value: totalRecycled },
                { source: 'processing', target: 'products', value: totalOutput },
                { source: 'processing', target: 'byproducts', value: byProducts },
                { source: 'processing', target: 'waste', value: totalWaste * 0.2 },
                { source: 'processing', target: 'emissions', value: totalEmissions / 100 },
                { source: 'products', target: 'recycling', value: totalRecycled },
                { source: 'recycling', target: 'recycled', value: totalRecycled }
            );
        }

        return { nodes, links };
    };

    return (
        <div className="executive-summary space-y-6">
            {/* Header with Project Info */}
            <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.projectName}</h2>
                        <p className="text-gray-600 mb-3">{selectedProject.geographicAnalysis?.city}, {selectedProject.geographicAnalysis?.state}</p>
                        <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                mode === 'linear' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {mode === 'linear' ? 'Linear Economy' : 'Circular Economy'}
                            </span>
                            <span className="text-sm text-gray-500">
                                Last updated: {new Date(selectedProject.analysisDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#BA7967]">
                            {circularityIndex?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-sm text-gray-600">Material Circularity Index</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Total Cost KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Economic</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            ${(currentData.totalCost / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-sm text-gray-600 mb-3">Total Investment</div>
                        {mode === 'circular' && (
                            <div className="flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                {((costSavings / linearData.totalCost) * 100).toFixed(1)}% savings vs linear
                            </div>
                        )}
                    </div>

                    {/* ROI KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-[#BA7967]/10 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-[#BA7967]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Economic</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {currentData.roi?.toFixed(1) || ((circularData.totalCost - linearData.totalCost) / linearData.totalCost * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mb-3">Return on Investment</div>
                        <div className="text-xs text-gray-500">
                            Payback: {currentData.paybackPeriod?.toFixed(1) || 'N/A'} months
                        </div>
                    </div>

                    {/* CO2 Emissions KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Environmental</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {((comparativeMetrics.carbonFootprint?.[mode] || currentData.totalEmissions) / 1000).toFixed(2)}k
                        </div>
                        <div className="text-sm text-gray-600 mb-3">kg CO₂ Equivalent</div>
                        {mode === 'circular' && (
                            <div className="flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                {gwpReduction.toFixed(1)}% reduction
                            </div>
                        )}
                    </div>

                    {/* Water Usage KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Environmental</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {((comparativeMetrics.waterUsage?.[mode] || currentData.waterConsumption) / 1000).toFixed(1)}k
                        </div>
                        <div className="text-sm text-gray-600 mb-3">Liters Water Used</div>
                        {mode === 'circular' && waterSavings && (
                            <div className="flex items-center text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                                {waterSavings.toFixed(1)}% saved
                            </div>
                        )}
                    </div>

                    {/* Material Circularity Index KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Circularity</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {circularityIndex?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-sm text-gray-600 mb-3">MCI Score</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${circularityIndex || 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Recycling Rate KPI */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Circularity</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {recyclingRate?.toFixed(1) || 'N/A'}%
                        </div>
                        <div className="text-sm text-gray-600 mb-3">Material Recovery Rate</div>
                        <div className="text-xs text-gray-500">
                            {((recyclingRate || 0) / 100 * (currentData.totalMaterialInput || productionStages.reduce((sum, stage) => sum + (stage.materialInput || 0), 0)) / 1000).toFixed(1)}k kg recovered
                        </div>
                    </div>
                </div>
            </div>

            {/* Linear vs Circular Comparison */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Linear vs Circular Comparison</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Comparison Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Cost Timeline Projection
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip 
                                    formatter={(value) => `$${(value / 1000000).toFixed(2)}M`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="linear" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Linear Model" />
                                <Line type="monotone" dataKey="circular" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Circular Model" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                <strong>Projected Savings:</strong> ${(costSavings / 1000000).toFixed(2)}M over 5 years
                            </div>
                        </div>
                    </div>

                    {/* GWP Comparison Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            GWP Reduction Timeline
                        </h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={gwpTimelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip 
                                    formatter={(value) => `${(value / 1000000).toFixed(2)}M kg CO₂e`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="linear" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Linear Model" />
                                <Line type="monotone" dataKey="circular" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Circular Model" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                            <div className="text-sm text-green-700">
                                <strong>Impact Reduction:</strong> {gwpReduction.toFixed(1)}% lower emissions with circular model
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cost-Benefit Overview */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost-Benefit Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Initial Investment</span>
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Cost</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 mb-1">
                            ${(circularData.totalCost / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-gray-500">Circular economy setup</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Annual Savings</span>
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Benefit</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 mb-1">
                            ${(costSavings / 5 / 1000000).toFixed(2)}M/yr
                        </div>
                        <div className="text-xs text-gray-500">Operational cost reduction</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Net Present Value</span>
                            <span className="text-xs text-[#BA7967] bg-[#BA7967]/10 px-2 py-1 rounded">ROI</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 mb-1">
                            ${(costSavings / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-gray-500">5-year projection</div>
                    </div>
                </div>

                {/* Detailed Benefits Table */}
                <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benefit Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linear Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Circular Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Improvement</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Cost</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${(linearData.totalCost / 1000000).toFixed(2)}M</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${(circularData.totalCost / 1000000).toFixed(2)}M</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-green-600 font-medium">
                                        -${(costSavings / 1000000).toFixed(2)}M
                                    </span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">GWP Emissions</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{((comparativeMetrics.carbonFootprint?.linear || linearData.totalEmissions) / 1000).toFixed(1)}k kg</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{((comparativeMetrics.carbonFootprint?.circular || circularData.totalEmissions) / 1000).toFixed(1)}k kg</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-green-600 font-medium">
                                        -{gwpReduction.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Water Usage</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{((comparativeMetrics.waterUsage?.linear || linearData.waterConsumption) / 1000).toFixed(1)}k L</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{((comparativeMetrics.waterUsage?.circular || circularData.waterConsumption) / 1000).toFixed(1)}k L</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-blue-600 font-medium">
                                        -{waterSavings.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Material Recovery</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{linearData.recyclingRate || 0}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{recyclingRate?.toFixed(1)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-green-600 font-medium">
                                        +{((recyclingRate || 0) - (linearData.recyclingRate || 0)).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Implementation Timeline */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Timeline</h3>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200"></div>
                        <div 
                            className="absolute top-8 left-0 h-1 bg-[#BA7967] transition-all duration-500"
                            style={{ width: '40%' }}
                        ></div>

                        {/* Timeline Steps */}
                        <div className="relative grid grid-cols-5 gap-4">
                            {timelinePhases.map((phase, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    {/* Step Circle */}
                                    <div className={`
                                        w-16 h-16 rounded-full flex items-center justify-center relative z-10 border-4
                                        ${phase.status === 'completed' 
                                            ? 'bg-[#BA7967] border-[#BA7967]' 
                                            : phase.status === 'in-progress'
                                            ? 'bg-white border-[#BA7967]'
                                            : 'bg-white border-gray-300'
                                        }
                                    `}>
                                        {phase.status === 'completed' ? (
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : phase.status === 'in-progress' ? (
                                            <div className="w-6 h-6 rounded-full bg-[#BA7967] animate-pulse"></div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                        )}
                                    </div>

                                    {/* Step Info */}
                                    <div className="mt-4 text-center">
                                        <div className={`text-sm font-semibold mb-1 ${
                                            phase.status === 'completed' || phase.status === 'in-progress'
                                                ? 'text-gray-900'
                                                : 'text-gray-500'
                                        }`}>
                                            {phase.phase}
                                        </div>
                                        <div className="text-xs text-gray-500">{phase.duration}</div>
                                        {phase.status === 'in-progress' && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#BA7967] text-white">
                                                    In Progress
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Summary */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-[#BA7967]">2</div>
                                <div className="text-sm text-gray-600">Phases Completed</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-[#BA7967]">1</div>
                                <div className="text-sm text-gray-600">Currently Active</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-400">2</div>
                                <div className="text-sm text-gray-600">Upcoming Phases</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Material & Energy Flow Sankey Diagram */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Material & Energy Flow Analysis</h3>
                        <p className="text-sm text-gray-600 mt-1">Interactive Sankey diagram showing resource flows through production stages</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSankeyMode('linear')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                sankeyMode === 'linear'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Linear Flow
                        </button>
                        <button
                            onClick={() => setSankeyMode('circular')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                sankeyMode === 'circular'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Circular Flow
                        </button>
                    </div>
                </div>

                <SankeyDiagram
                    data={generateSankeyData(productionStages, sankeyMode)}
                    width={900}
                    height={500}
                    onNodeClick={(node) => setSelectedNode(node)}
                />

                {selectedNode && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">{selectedNode.name}</h4>
                                <p className="text-sm text-blue-700">
                                    Value: {selectedNode.value.toLocaleString()} {selectedNode.unit}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Type: {selectedNode.type === 'input' ? 'Input Material' : 
                                           selectedNode.type === 'process' ? 'Processing Stage' :
                                           selectedNode.type === 'output' ? 'Product Output' : 'Waste Stream'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Recommendations Preview */}
            {aiRecommendations.length > 0 && (
                <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg border border-[#BA7967]/20 p-6">
                    <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-[#BA7967] mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900 mb-2">Top AI Recommendation</h4>
                            <p className="text-sm text-gray-700 mb-3">{aiRecommendations[0].description || aiRecommendations[0].title}</p>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-green-700 bg-green-50 px-2 py-1 rounded">
                                    Impact: {aiRecommendations[0].impact?.emissionReduction || aiRecommendations[0].emissionImpact || 'Positive'}
                                </span>
                                <span className="text-[#BA7967] bg-[#BA7967]/10 px-2 py-1 rounded">
                                    Priority: {aiRecommendations[0].priority || 'High'}
                                </span>
                                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    Timeframe: {aiRecommendations[0].implementationTime || aiRecommendations[0].impact?.timeframe || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
