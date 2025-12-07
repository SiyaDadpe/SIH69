import React, { useState } from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';

export default function Header({ selectedProject, mode = 'circular', onModeChange, onProjectSelect, projects, selectedProjects = [], onProjectsCompare }) {
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    
    // Calculate metrics for quick stats (using calculatelca-style circularity fields when available)
    const getMetrics = () => {
        if (!selectedProject) return null;

        const circularityScore =
            selectedProject.circularityScore ??
            selectedProject.circularityIndex ??
            selectedProject.circularModel?.materialCircularity ??
            0;

        const linearIndex = selectedProject.linearityIndex;
        const circularIndex = selectedProject.circularityIndex;

        const gwpLinear = selectedProject.linearModel?.totalEmissions || selectedProject.totalGWP || 0;
        const gwpCircular =
            typeof circularIndex === 'number' && typeof linearIndex === 'number' && gwpLinear > 0
                ? gwpLinear * (1 - circularIndex)
                : selectedProject.circularModel?.totalEmissions || 0;

        const gwpReduction = gwpLinear > 0
            ? Math.round(((gwpLinear - gwpCircular) / gwpLinear) * 100)
            : 0;

        const costSavings = selectedProject.comparativeMetrics?.totalCost?.savings || 0;

        return { circularityScore, gwpReduction, costSavings };
    };

    const metrics = getMetrics();

    // Data for mini bar charts
    const getChartData = (metric, value) => [
        { name: metric, value: value, max: 100 }
    ];

    const handleExport = (type) => {
        console.log(`Export triggered: ${type}`, {
            project: selectedProject?.projectName || 'No project selected',
            mode: mode,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <header className="analytics-header bg-white shadow-sm border-b border-gray-200 mb-6">
            <div className="px-6 py-4">
                {/* Top Row: Title and Export Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                        {selectedProject && (
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedProject.projectName} • {selectedProject.geographicAnalysis?.city}, {selectedProject.geographicAnalysis?.state}
                            </p>
                        )}
                    </div>

                    {/* Export Controls */}
                    {/* Commented out: Share, Export, Print buttons
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('share')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Share"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                        <button
                            onClick={() => handleExport('export')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Export"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={() => handleExport('print')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Print"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                    </div>
                    */}
                </div>

                {/* Middle Row: Analysis Mode Toggle & Project Comparison */}
                {/* Commented out: Analysis Mode Toggle (Linear Economy, Circular Economy, Comparison)
                {selectedProject && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Analysis Mode:</span>
                            <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1">
                                <button
                                    onClick={() => onModeChange('linear')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        mode === 'linear'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        Linear Economy
                                    </div>
                                </button>
                                <button
                                    onClick={() => onModeChange('circular')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        mode === 'circular'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Circular Economy
                                    </div>
                                </button>
                                <button
                                    onClick={() => onModeChange('comparison')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                        mode === 'comparison'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#BA7967]"></div>
                                        Comparison
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Multi-Project Comparison */}
                        {/* <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Compare Projects:</span>
                            <div className="relative">
                */}
                {selectedProject && (
                    <div className="flex items-center justify-between mb-4">
                        {/* Multi-Project Comparison */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Compare Projects:</span>
                            <div className="relative">
                                <button
                                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    {selectedProjects.length > 0 ? `${selectedProjects.length} Selected` : 'Select Projects'}
                                </button>

                                {showProjectSelector && (
                                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                                            <h4 className="font-semibold text-gray-900 text-sm">Select Projects to Compare</h4>
                                            <p className="text-xs text-gray-600 mt-1">Choose 2-3 projects for side-by-side comparison</p>
                                        </div>
                                        <div className="p-2">
                                            {projects && projects.map((project) => (
                                                <label
                                                    key={project.projectId}
                                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProjects.some(p => p.projectId === project.projectId)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                if (selectedProjects.length < 3) {
                                                                    onProjectsCompare([...selectedProjects, project]);
                                                                }
                                                            } else {
                                                                onProjectsCompare(selectedProjects.filter(p => p.projectId !== project.projectId));
                                                            }
                                                        }}
                                                        disabled={!selectedProjects.some(p => p.projectId === project.projectId) && selectedProjects.length >= 3}
                                                        className="w-4 h-4 text-[#BA7967] border-gray-300 rounded focus:ring-[#BA7967]"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900">{project.projectName}</div>
                                                        <div className="text-xs text-gray-500">{project.geographicAnalysis?.city}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    onProjectsCompare([]);
                                                    setShowProjectSelector(false);
                                                }}
                                                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={() => setShowProjectSelector(false)}
                                                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#BA7967] rounded hover:bg-[#A66857]"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Row: Quick Stats Cards */}
                {selectedProject && metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Circularity Score Card */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-green-700 uppercase mb-1">Circularity Score</p>
                                    <p className="text-3xl font-bold text-green-900">{metrics.circularityScore}%</p>
                                    <p className="text-xs text-green-600 mt-1">Material Circularity Index</p>
                                </div>
                                <div className="w-16 h-16">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getChartData('Circularity', metrics.circularityScore)}>
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                <Cell fill="#16a34a" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${metrics.circularityScore}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* GWP Reduction Card */}
                        <div className="bg-gradient-to-br from-[#BA7967]/10 to-[#BA7967]/20 rounded-lg p-4 border border-[#BA7967]/30">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-[#BA7967] uppercase mb-1">GWP Reduction</p>
                                    <p className="text-3xl font-bold text-gray-900">{metrics.gwpReduction}%</p>
                                    <p className="text-xs text-[#a86b5c] mt-1">CO₂ Emissions Saved</p>
                                </div>
                                <div className="w-16 h-16">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getChartData('GWP', metrics.gwpReduction)}>
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                <Cell fill="#BA7967" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="w-full bg-[#BA7967]/20 rounded-full h-2 mt-2">
                                <div 
                                    className="bg-[#BA7967] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${metrics.gwpReduction}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Cost Savings Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-700 uppercase mb-1">Cost Savings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${(metrics.costSavings / 1000000).toFixed(2)}M
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Total: ${metrics.costSavings.toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center w-16 h-16">
                                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-2">
                                <span className="flex items-center text-green-700">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    {((metrics.costSavings / (selectedProject.linearModel?.totalCost || 1)) * 100).toFixed(1)}% savings
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Project Selected State */}
                {!selectedProject && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Select a project to view analytics</p>
                        <p className="text-sm text-gray-500 mt-1">Use the project selector below to get started</p>
                    </div>
                )}
            </div>
        </header>
    );
}
