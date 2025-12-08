

import React from 'react';

export default function ExecutiveSummary({ mode, selectedProject }) {
    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view the executive summary
            </div>
        );
    }

    // Helper function to extract value from nested object or direct value
    const getValue = (field) => {
        if (!field) return 0;
        return typeof field === 'object' ? (field.value || 0) : field;
    };

    // Helper function to extract unit from nested object or use default
    const getUnit = (field, defaultUnit) => {
        if (!field) return defaultUnit;
        return typeof field === 'object' ? (field.unit || defaultUnit) : defaultUnit;
    };

    // Extract metrics from calculatelca data
    const metrics = [
        {
            label: 'Total Energy Consumption',
            value: getValue(selectedProject.totalEnergyConsumption || selectedProject.totalEnergy),
            unit: getUnit(selectedProject.totalEnergyConsumption || selectedProject.totalEnergy, 'kWh'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        },
        {
            label: 'Total CO2 Emissions',
            value: getValue(selectedProject.totalCO2Emissions || selectedProject.totalGWP),
            unit: getUnit(selectedProject.totalCO2Emissions || selectedProject.totalGWP, 'kg CO2-eq'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
            ),
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        },
        {
            label: 'Total Water Usage',
            value: getValue(selectedProject.totalWaterUsage || selectedProject.totalWater),
            unit: getUnit(selectedProject.totalWaterUsage || selectedProject.totalWater, 'm³'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            ),
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            label: 'Total Waste Generation',
            value: getValue(selectedProject.totalWasteGeneration),
            unit: getUnit(selectedProject.totalWasteGeneration, 'kg'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        {
            label: 'Total Air Quality Impact',
            value: getValue(selectedProject.totalAirQualityImpact),
            unit: getUnit(selectedProject.totalAirQualityImpact, 'kg PM2.5-eq'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
            ),
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            label: 'Energy Intensity',
            value: getValue(selectedProject.energyIntensity),
            unit: getUnit(selectedProject.energyIntensity, 'kWh/tonne'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200'
        },
        {
            label: 'Carbon Intensity',
            value: getValue(selectedProject.carbonIntensity),
            unit: getUnit(selectedProject.carbonIntensity, 'kg CO2-eq/tonne'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        },
        {
            label: 'Circularity Score',
            value: getValue(selectedProject.circularityScore),
            unit: getUnit(selectedProject.circularityScore, 'score (0-100)'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            label: 'Circularity Rating',
            value: selectedProject.circularityRating || 'N/A',
            unit: '',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            isText: true
        },
        {
            label: 'Material Recovery Rate',
            value: getValue(selectedProject.materialRecoveryRate),
            unit: getUnit(selectedProject.materialRecoveryRate, '%'),
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            ),
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            borderColor: 'border-teal-200'
        }
    ];

    return (
        <div className="executive-summary p-6">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Executive Summary</h2>
                <p className="text-gray-600">Key metrics from LCA analysis for {selectedProject.projectName}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <div 
                        key={index}
                        className={`bg-white rounded-xl shadow-sm border-2 ${metric.borderColor} p-6 hover:shadow-md transition-shadow duration-200`}
                    >
                        <div className={`${metric.bgColor} ${metric.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                            {metric.icon}
                        </div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.label}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                                {metric.isText 
                                    ? metric.value 
                                    : typeof metric.value === 'number' 
                                        ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                        : metric.value
                                }
                            </span>
                            {metric.unit && (
                                <span className="text-sm font-medium text-gray-500">{metric.unit}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

