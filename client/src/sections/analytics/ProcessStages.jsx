import React, { useState } from 'react';

export default function ProcessStages({ mode, selectedProject }) {
    const [activeStage, setActiveStage] = useState('mining');

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view process stage analytics
            </div>
        );
    }

    // Extract lcaStages data from selectedProject
    const lcaStages = selectedProject.stages || {};

    // Define the 7 lifecycle stages with their display properties
    const stages = [
        {
            id: 'mining',
            name: 'Mining',
            description: 'Extraction of bauxite ore',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            ),
            color: 'from-amber-600 to-amber-700',
            borderColor: 'border-amber-300',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700'
        },
        {
            id: 'beneficiation',
            name: 'Beneficiation',
            description: 'Ore processing and concentration',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
            ),
            color: 'from-blue-600 to-blue-700',
            borderColor: 'border-blue-300',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700'
        },
        {
            id: 'refining',
            name: 'Refining',
            description: 'Bayer process to produce alumina',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            color: 'from-orange-600 to-orange-700',
            borderColor: 'border-orange-300',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
        },
        {
            id: 'smelting',
            name: 'Smelting',
            description: 'Electrolytic reduction to aluminum',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
            ),
            color: 'from-red-600 to-red-700',
            borderColor: 'border-red-300',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700'
        },
        {
            id: 'manufacturing',
            name: 'Manufacturing',
            description: 'Product fabrication and forming',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            color: 'from-purple-600 to-purple-700',
            borderColor: 'border-purple-300',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700'
        },
        {
            id: 'recycling',
            name: 'Recycling',
            description: 'Secondary aluminum recovery',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
            color: 'from-green-600 to-green-700',
            borderColor: 'border-green-300',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        },
        {
            id: 'valorization',
            name: 'Valorization',
            description: 'Waste recovery and value extraction',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            ),
            color: 'from-teal-600 to-teal-700',
            borderColor: 'border-teal-300',
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-700'
        }
    ];

    // Get data for the active stage
    const activeStageData = lcaStages[activeStage] || {};
    const stageConfig = stages.find(s => s.id === activeStage) || stages[0];

    // Helper function to format value with unit
    const formatValue = (valueObj) => {
        if (!valueObj) return 'N/A';
        if (typeof valueObj === 'object' && valueObj.value !== undefined) {
            const value = typeof valueObj.value === 'number' 
                ? valueObj.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : valueObj.value;
            return `${value} ${valueObj.unit || ''}`;
        }
        return valueObj;
    };

    // Helper function to get AI prediction confidence color
    const getConfidenceColor = (confidence) => {
        if (!confidence) return 'text-gray-500';
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="process-stages p-6 space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Process Stage Analytics</h2>
                <p className="text-gray-600">Detailed metrics for each lifecycle stage with AI predictions</p>
            </div>

            {/* Stage Selector Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => {
                        const isActive = stage.id === activeStage;
                        const stageData = lcaStages[stage.id];
                        const isCompleted = stageData?.completed;

                        return (
                            <button
                                key={stage.id}
                                onClick={() => setActiveStage(stage.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                                    ${isActive 
                                        ? `bg-gradient-to-r ${stage.color} text-white shadow-md scale-105` 
                                        : `${stage.bgColor} ${stage.textColor} hover:shadow-sm`
                                    }
                                `}
                            >
                                <div className={isActive ? 'text-white' : stage.textColor}>
                                    {stage.icon}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-semibold">{stage.name}</div>
                                    {isCompleted && (
                                        <div className="text-xs opacity-75 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Completed
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Stage Content */}
            {activeStageData && Object.keys(activeStageData).length > 0 ? (
                <div className="space-y-6">
                    {/* Stage Header Card */}
                    <div className={`bg-gradient-to-r ${stageConfig.color} text-white rounded-xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">{stageConfig.name}</h3>
                                <p className="text-white/90">{stageConfig.description}</p>
                            </div>
                            <div className="text-white/90">
                                {stageConfig.icon}
                            </div>
                        </div>
                    </div>

                    {/* Main Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Energy Consumption */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-yellow-50 text-yellow-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700">Energy</h4>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatValue(activeStageData.energyConsumption)}
                            </div>
                        </div>

                        {/* CO2 Emissions */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gray-50 text-gray-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700">CO2 Emissions</h4>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatValue(activeStageData.co2Emissions)}
                            </div>
                        </div>

                        {/* Water Usage */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700">Water Usage</h4>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatValue(activeStageData.waterUsage)}
                            </div>
                        </div>

                        {/* Waste Generation */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700">Waste</h4>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatValue(activeStageData.wasteGeneration)}
                            </div>
                        </div>

                        {/* Air Quality Impact */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-700">Air Quality</h4>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatValue(activeStageData.airQualityImpact)}
                            </div>
                        </div>
                    </div>

                    {/* Stage Parameters and AI Predictions */}
                    {activeStageData.parameters && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-[#BA7967]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Stage Parameters & AI Predictions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(activeStageData.parameters).map(([key, value]) => {
                                    // Skip arrays, nulls, and the aiPredictions object itself
                                    if (Array.isArray(value) || value === null || key === 'aiPredictions') return null;
                                    
                                    // Check if this parameter has AI prediction data
                                    const aiPrediction = activeStageData.parameters.aiPredictions?.[key];
                                    const hasAIPrediction = aiPrediction && typeof aiPrediction === 'object';

                                    return (
                                        <div 
                                            key={key}
                                            className={`p-4 rounded-lg border-2 ${hasAIPrediction ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-sm font-medium text-gray-700 capitalize">
                                                    {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                                                </h4>
                                                {hasAIPrediction && (
                                                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M13 7H7v6h6V7z" />
                                                            <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                                                        </svg>
                                                        AI
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-xl font-bold text-gray-900 mb-2">
                                                {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : value}
                                            </div>

                                            {hasAIPrediction && (
                                                <div className="space-y-2 mt-3 pt-3 border-t border-blue-200">
                                                    {aiPrediction.confidence !== null && aiPrediction.confidence !== undefined && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-600">Confidence:</span>
                                                            <span className={`font-semibold ${getConfidenceColor(aiPrediction.confidence)}`}>
                                                                {(aiPrediction.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                    {aiPrediction.interval && (
                                                        <div className="text-xs">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-gray-600">Interval:</span>
                                                                <span className="font-medium text-gray-700">
                                                                    {aiPrediction.interval.lower?.toFixed(2)} - {aiPrediction.interval.upper?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            {/* Visual interval bar */}
                                                            <div className="relative h-2 bg-blue-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="absolute h-full bg-blue-500 rounded-full"
                                                                    style={{
                                                                        left: '45%',
                                                                        width: '10%'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {aiPrediction.rmse !== null && aiPrediction.rmse !== undefined && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-600">RMSE:</span>
                                                            <span className="font-medium text-gray-700">
                                                                {aiPrediction.rmse.toFixed(3)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Location and Process Info */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {activeStageData.parameters.location && (
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Location</div>
                                            <div className="font-semibold text-gray-900">{activeStageData.parameters.location}</div>
                                        </div>
                                    </div>
                                )}

                                {activeStageData.parameters.processes && Array.isArray(activeStageData.parameters.processes) && activeStageData.parameters.processes.length > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Processes</div>
                                            <div className="font-semibold text-gray-900">
                                                {activeStageData.parameters.processes.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeStageData.parameters.applicableProcesses && Array.isArray(activeStageData.parameters.applicableProcesses) && activeStageData.parameters.applicableProcesses.length > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
                                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                        <div>
                                            <div className="text-xs text-gray-600 mb-1">Applicable Processes</div>
                                            <div className="font-semibold text-gray-900">
                                                {activeStageData.parameters.applicableProcesses.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600">
                        This stage has not been completed yet or no data is available for {stageConfig.name}.
                    </p>
                </div>
            )}
        </div>
    );
}
