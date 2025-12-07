import React from 'react';
import SankeyDiagram from '../../components/SankeyDiagram';

export default function SankeyDiagramTab({ selectedProject }) {
    console.log('🔍 SankeyDiagramTab - selectedProject:', selectedProject);
    console.log('🔍 SankeyDiagramTab - sankeyData:', selectedProject?.sankeyData);
    
    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view the Sankey diagram
            </div>
        );
    }

    // Extract sankeyData from selectedProject
    let sankeyData = selectedProject.sankeyData;

    // Use dummy data if sankeyData is not available (for backwards compatibility)
    if (!sankeyData || !sankeyData.nodes || sankeyData.nodes.length === 0) {
        console.warn('⚠️ No sankeyData found in selectedProject. Using demo data.');
        sankeyData = {
            normalizationBasisTonnes: 1,
            nodes: [
                "Primary Production",
                "Recycling Input",
                "Manufacturing",
                "Manufacturing Scrap",
                "Product Use",
                "Post-use Collection",
                "Recycling Plant",
                "Valorization",
                "Landfill / Losses"
            ],
            links: [
                { source: 0, target: 2, value: 0.7 },
                { source: 1, target: 2, value: 0.3 },
                { source: 2, target: 3, value: 0.1 },
                { source: 2, target: 4, value: 0.9 },
                { source: 3, target: 6, value: 0.08 },
                { source: 3, target: 8, value: 0.02 },
                { source: 4, target: 5, value: 0.7 },
                { source: 4, target: 8, value: 0.2 },
                { source: 5, target: 6, value: 0.5 },
                { source: 5, target: 8, value: 0.2 },
                { source: 6, target: 1, value: 0.58 },
                { source: 8, target: 7, value: 0.1 },
                { source: 8, target: 8, value: 0.32 }
            ]
        };
    }

    // Convert the calculatelca format to the SankeyDiagram component format
    const convertSankeyData = () => {
        const nodes = sankeyData.nodes.map((nodeName, index) => {
            // Determine node type based on name
            let type = 'process';
            if (nodeName.toLowerCase().includes('production') || nodeName.toLowerCase().includes('input')) {
                type = 'input';
            } else if (nodeName.toLowerCase().includes('loss') || nodeName.toLowerCase().includes('waste') || nodeName.toLowerCase().includes('landfill')) {
                type = 'waste';
            } else if (nodeName.toLowerCase().includes('use') || nodeName.toLowerCase().includes('product')) {
                type = 'output';
            }

            // Determine column for layout
            let column = 1; // default middle
            if (type === 'input') column = 0;
            else if (type === 'output' || type === 'waste') column = 2;

            return {
                id: nodeName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-'),
                name: nodeName,
                value: 0, // Will be calculated from links
                column: column,
                type: type,
                unit: 't'
            };
        });

        // Convert links from array indices to node IDs
        const links = sankeyData.links.map(link => {
            const sourceNode = nodes[link.source];
            const targetNode = nodes[link.target];
            
            return {
                source: sourceNode.id,
                target: targetNode.id,
                value: link.value
            };
        });

        return { nodes, links };
    };

    const diagramData = convertSankeyData();

    return (
        <div className="sankey-diagram-tab p-6 space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Material Flow Diagram</h2>
                <p className="text-gray-600">
                    Visualization of material flows through the production lifecycle
                </p>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-500 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Read This Diagram</h3>
                        <div className="text-sm text-gray-700 space-y-2">
                            <p>• <strong>Flow width</strong> represents the volume of material moving between stages</p>
                            <p>• <strong>Green nodes</strong> indicate inputs and recycling loops</p>
                            <p>• <strong>Blue nodes</strong> represent processing stages</p>
                            <p>• <strong>Red nodes</strong> show waste and losses</p>
                            <p>• <strong>Normalization basis:</strong> {sankeyData.normalizationBasisTonnes} tonne(s)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sankey Diagram */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-[600px]">
                    <SankeyDiagram
                        data={diagramData}
                        onNodeClick={(node) => console.log('Node clicked:', node)}
                        selectedNode={null}
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <div>
                            <div className="font-medium text-gray-900">Input</div>
                            <div className="text-xs text-gray-600">Raw materials & recycled content</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <div>
                            <div className="font-medium text-gray-900">Process</div>
                            <div className="text-xs text-gray-600">Manufacturing & transformation</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <div>
                            <div className="font-medium text-gray-900">Output</div>
                            <div className="text-xs text-gray-600">Final products & use phase</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <div>
                            <div className="font-medium text-gray-900">Waste</div>
                            <div className="text-xs text-gray-600">Losses & landfill</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flow Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Nodes</div>
                            <div className="text-2xl font-bold text-gray-900">{sankeyData.nodes.length}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Material Flows</div>
                            <div className="text-2xl font-bold text-gray-900">{sankeyData.links.length}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Basis</div>
                            <div className="text-2xl font-bold text-gray-900">{sankeyData.normalizationBasisTonnes}t</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
