import React, { useState } from 'react';

export default function SankeyDiagram({ data, width = 800, height = 400, onNodeClick }) {
    const [hoveredNode, setHoveredNode] = useState(null);
    const [hoveredLink, setHoveredLink] = useState(null);

    const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
    const links = Array.isArray(data?.links) ? data.links : [];

    // Calculate node positions
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Group nodes by column
    const columns = {};
    nodes.forEach(node => {
        if (!columns[node.column]) columns[node.column] = [];
        columns[node.column].push(node);
    });

    const numColumns = Object.keys(columns).length;
    const columnWidth = innerWidth / (numColumns - 1 || 1);

    // Calculate node heights based on value
    const totalValue = nodes.length > 0 ? Math.max(...nodes.map(n => n.value || 0)) || 1 : 1;
    const nodePositions = {};
    
    Object.entries(columns).forEach(([col, colNodes]) => {
        const colNum = parseInt(col);
        let yOffset = 0;
        const spacing = 20;
        const availableHeight = innerHeight - (colNodes.length - 1) * spacing;
        
        colNodes.forEach((node, idx) => {
            const nodeHeight = ((node.value || 0) / totalValue) * availableHeight * 0.8 || 8;
            nodePositions[node.id] = {
                x: margin.left + colNum * columnWidth,
                y: margin.top + yOffset,
                width: 20,
                height: nodeHeight
            };
            yOffset += nodeHeight + spacing;
        });
    });

    // Generate link paths
    const generatePath = (link) => {
        const source = nodePositions[link.source];
        const target = nodePositions[link.target];
        
        if (!source || !target) return '';

        const x0 = source.x + source.width;
        const y0 = source.y + source.height / 2;
        const x1 = target.x;
        const y1 = target.y + target.height / 2;
        const xi = (x0 + x1) / 2;

        return `M${x0},${y0} C${xi},${y0} ${xi},${y1} ${x1},${y1}`;
    };

    const getLinkWidth = (value) => {
        return ((value || 0) / totalValue) * innerHeight * 0.15;
    };

    const getNodeColor = (node) => {
        if (node.type === 'input') return '#3B82F6'; // Blue
        if (node.type === 'process') return '#BA7967'; // Primary
        if (node.type === 'output') return '#22C55E'; // Green
        if (node.type === 'waste') return '#EF4444'; // Red
        return '#6B7280'; // Gray
    };

    return (
        <div className="relative">
            <svg width={width} height={height} className="overflow-visible">
                {/* Links */}
                <g className="links">
                    {links.map((link, idx) => {
                        const linkWidth = getLinkWidth(link.value);
                        const isHovered = hoveredLink === idx;
                        
                        return (
                            <g key={idx}>
                                <path
                                    d={generatePath(link)}
                                    fill="none"
                                    stroke={isHovered ? '#BA7967' : '#D1D5DB'}
                                    strokeWidth={linkWidth}
                                    opacity={isHovered ? 0.8 : 0.4}
                                    onMouseEnter={() => setHoveredLink(idx)}
                                    onMouseLeave={() => setHoveredLink(null)}
                                    className="transition-all duration-200 cursor-pointer"
                                />
                            </g>
                        );
                    })}
                </g>

                {/* Nodes */}
                <g className="nodes">
                    {nodes.map((node) => {
                        const pos = nodePositions[node.id];
                        if (!pos) return null;
                        
                        const isHovered = hoveredNode === node.id;

                        return (
                            <g
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                onClick={() => onNodeClick && onNodeClick(node)}
                                className="cursor-pointer"
                            >
                                <rect
                                    x={pos.x}
                                    y={pos.y}
                                    width={pos.width}
                                    height={pos.height}
                                    fill={getNodeColor(node)}
                                    opacity={isHovered ? 1 : 0.8}
                                    rx={4}
                                    className="transition-all duration-200"
                                />
                                <text
                                    x={pos.x + (node.column < numColumns / 2 ? pos.width + 8 : -8)}
                                    y={pos.y + pos.height / 2}
                                    textAnchor={node.column < numColumns / 2 ? 'start' : 'end'}
                                    dominantBaseline="middle"
                                    className="text-xs font-medium fill-gray-700"
                                >
                                    {node.name}
                                </text>
                                <text
                                    x={pos.x + (node.column < numColumns / 2 ? pos.width + 8 : -8)}
                                    y={pos.y + pos.height / 2 + 12}
                                    textAnchor={node.column < numColumns / 2 ? 'start' : 'end'}
                                    dominantBaseline="middle"
                                    className="text-xs fill-gray-500"
                                >
                                    {(node.value ?? 0).toLocaleString()} {node.unit || ''}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Tooltip */}
            {(hoveredNode || hoveredLink !== null) && (
                <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                    {hoveredNode && (
                        <div>
                            <div className="font-semibold text-gray-900">
                                {nodes.find(n => n.id === hoveredNode)?.name}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                                Value: {(nodes.find(n => n.id === hoveredNode)?.value ?? 0).toLocaleString()} 
                                {nodes.find(n => n.id === hoveredNode)?.unit || ''}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Click for details</div>
                        </div>
                    )}
                    {hoveredLink !== null && (
                        <div>
                            <div className="font-semibold text-gray-900">
                                {links[hoveredLink].source} → {links[hoveredLink].target}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                                Flow: {(links[hoveredLink].value ?? 0).toLocaleString()} units
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Input Materials</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#BA7967] rounded"></div>
                    <span>Processing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Products/Output</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Waste/Emissions</span>
                </div>
            </div>
        </div>
    );
}
