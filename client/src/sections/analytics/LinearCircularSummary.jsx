import React, { useState } from 'react';
import SankeyDiagram from '../../components/SankeyDiagram';

export default function LinearCircularSummary({ selectedProject }) {
    const [sankeyMode, setSankeyMode] = useState('circular');
    
    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view linear vs circular summary
            </div>
        );
    }

    const circularityIndex = selectedProject.circularityIndex ?? 0;
    const linearityIndex = selectedProject.linearityIndex ?? (circularityIndex ? 1 - circularityIndex : 0);
    const sankeyData = selectedProject.sankeyData || null;
    const circularityComponents = selectedProject.circularityComponents || null;

    const totalGWP = selectedProject.totalGWP || 0;
    const gwpLinear = totalGWP;
    const gwpCircular = gwpLinear * (1 - circularityIndex);
    const gwpReduction = gwpLinear > 0 ? ((gwpLinear - gwpCircular) / gwpLinear) * 100 : 0;

    const totalEnergy = selectedProject.totalEnergy || 0;
    const energyLinear = totalEnergy;
    const energyCircular = energyLinear * (1 - circularityIndex * 0.5);
    const energyReduction = energyLinear > 0 ? ((energyLinear - energyCircular) / energyLinear) * 100 : 0;

    const totalWater = selectedProject.totalWater || 0;
    const waterLinear = totalWater;
    const waterCircular = waterLinear * (1 - circularityIndex * 0.4);
    const waterReduction = waterLinear > 0 ? ((waterLinear - waterCircular) / waterLinear) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Linear vs Circular Summary</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Comparison of key impact indicators between a baseline linear pathway and the current circularity level for this project.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Circularity</div>
                        <div className="text-2xl font-bold text-[#BA7967] mb-1">
                            {(circularityIndex * 100).toFixed(1)}% circular
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            Linearity: {(linearityIndex * 100).toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${Math.min(100, Math.max(0, circularityIndex * 100))}%` }}
                            />
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">GWP (CO₂e)</div>
                        <div className="text-sm text-gray-700 mb-1 flex justify-between">
                            <span>Linear:</span>
                            <span>{(gwpLinear / 1000).toFixed(2)}k kg</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1 flex justify-between">
                            <span>Circular:</span>
                            <span>{(gwpCircular / 1000).toFixed(2)}k kg</span>
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                            ≈ {gwpReduction.toFixed(1)}% reduction
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Energy & Water</div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Energy linear:</span>
                            <span>{(energyLinear / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Energy circular:</span>
                            <span>{(energyCircular / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="text-xs text-green-700 mb-2">
                            ≈ {energyReduction.toFixed(1)}% lower energy
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Water linear:</span>
                            <span>{waterLinear.toFixed(2)} m³</span>
                        </div>
                        <div className="text-xs text-gray-700 mb-1 flex justify-between">
                            <span>Water circular:</span>
                            <span>{waterCircular.toFixed(2)} m³</span>
                        </div>
                        <div className="text-xs text-green-700">
                            ≈ {waterReduction.toFixed(1)}% lower water
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#FAF7F6] rounded-lg border border-[#BA7967]/20 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Narrative Summary</h3>
                <p className="text-sm text-gray-700">
                    With a circularity index of {(circularityIndex * 100).toFixed(1)}%, this project replaces a
                    portion of linear material flows with circular pathways. At this level of circularity, we estimate
                    around {gwpReduction.toFixed(1)}% lower greenhouse gas emissions and {energyReduction.toFixed(1)}%
                    lower energy use compared to a purely linear baseline, with additional reductions in water
                    consumption.
                </p>
            </div>

            {/* Circularity Components Breakdown */}
            {circularityComponents && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Circularity Components</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-gray-100 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Recycled Content</div>
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                                {((circularityComponents.recycledContentFactor || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${(circularityComponents.recycledContentFactor || 0) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">End-of-Life Recovery</div>
                            <div className="text-2xl font-bold text-green-600 mb-2">
                                {((circularityComponents.endOfLifeRecoveryFactor || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-green-500"
                                    style={{ width: `${(circularityComponents.endOfLifeRecoveryFactor || 0) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Valorization</div>
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                                {((circularityComponents.valorizationFactor || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-purple-500"
                                    style={{ width: `${(circularityComponents.valorizationFactor || 0) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Material Flow Sankey Diagram */}
            {sankeyData && sankeyData.nodes && sankeyData.links && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Material Flow Diagram</h3>
                            <p className="text-sm text-gray-600">Visualizing circular vs linear material pathways</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <SankeyDiagram
                            data={convertSankeyData(sankeyData)}
                            width={900}
                            height={500}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>Primary Input</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>Recycled Input</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span>Processing</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>Losses/Waste</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function convertSankeyData(sankeyData) {
    if (!sankeyData || !sankeyData.nodes || !sankeyData.links) {
        return { nodes: [], links: [] };
    }

    // Convert backend format (nodes as string array) to D3 format
    const nodes = Array.isArray(sankeyData.nodes)
        ? sankeyData.nodes.map((name, idx) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            value: 0,
            column: idx < 2 ? 0 : idx < 5 ? 1 : 2,
            type: name.includes('Primary') || name.includes('Recycling') ? 'input' : 
                  name.includes('Manufacturing') ? 'process' : 
                  name.includes('Landfill') || name.includes('Losses') ? 'waste' : 'output',
            unit: 't'
        }))
        : sankeyData.nodes;

    const links = sankeyData.links.map(link => ({
        source: typeof link.source === 'number' ? nodes[link.source]?.id || link.source : link.source,
        target: typeof link.target === 'number' ? nodes[link.target]?.id || link.target : link.target,
        value: link.value || 0
    }));

    return { nodes, links };
}
