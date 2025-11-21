import React, { useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, 
    PolarRadiusAxis, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import SankeyDiagram from '../../components/SankeyDiagram';

export default function ProcessStages({ mode, selectedProject }) {
    const [expandedStage, setExpandedStage] = useState(null);
    const [selectedSankeyNode, setSelectedSankeyNode] = useState(null);

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view process stage analytics
            </div>
        );
    }

    const productionStages = selectedProject.productionStages || [];
    
    // Define the seven standard aluminum production stages
    const aluminumStages = [
        {
            id: 'bauxite-mining',
            name: 'Bauxite Mining',
            description: 'Extraction of bauxite ore from the earth',
            icon: '⛏️',
            color: '#8B4513'
        },
        {
            id: 'alumina-refining',
            name: 'Alumina Refining',
            description: 'Converting bauxite to alumina (Al₂O₃) via Bayer process',
            icon: '🏭',
            color: '#FF6B6B'
        },
        {
            id: 'anode-production',
            name: 'Anode Production',
            description: 'Manufacturing carbon anodes for electrolysis',
            icon: '⚡',
            color: '#4ECDC4'
        },
        {
            id: 'smelting',
            name: 'Smelting',
            description: 'Electrolytic reduction of alumina to aluminum metal',
            icon: '🔥',
            color: '#FF9F1C'
        },
        {
            id: 'casting-fabrication',
            name: 'Casting & Fabrication',
            description: 'Shaping and forming aluminum products',
            icon: '🔨',
            color: '#95E1D3'
        },
        {
            id: 'use-phase',
            name: 'Use Phase',
            description: 'Product lifecycle and application',
            icon: '🚗',
            color: '#6C5CE7'
        },
        {
            id: 'recycling-eol',
            name: 'Recycling & EOL',
            description: 'End-of-life recovery and circular processing',
            icon: '♻️',
            color: '#00B894'
        }
    ];

    // Map production stages from data to aluminum stages
    const stagesWithData = aluminumStages.map((stage, index) => {
        const dataStage = productionStages[index] || {};
        const currentMetrics = mode === 'linear' ? dataStage.linearMetrics : dataStage.circularMetrics;
        
        return {
            ...stage,
            stageNumber: index + 1,
            data: dataStage,
            metrics: currentMetrics || {},
            // Calculate energy intensity (GJ/ton) - mock calculation
            energyIntensity: dataStage.energyInput ? (dataStage.energyInput / (dataStage.productOutput || 1000) * 0.0036).toFixed(2) : (15 - index * 1.5).toFixed(2),
            // Industry average benchmarks
            industryAvg: {
                efficiency: 65 + Math.random() * 15,
                energyIntensity: 12 + index * 1.2
            }
        };
    });

    // Prepare efficiency benchmarking data
    const benchmarkData = stagesWithData.map(stage => ({
        name: stage.name.split(' ')[0],
        actual: stage.data.processEfficiency || stage.metrics.efficiency || 70,
        industry: stage.industryAvg.efficiency
    }));

    const toggleStage = (stageId) => {
        setExpandedStage(expandedStage === stageId ? null : stageId);
    };

    // Generate stage-specific Sankey data showing material/waste flows
    const generateStageSankeyData = (stageData) => {
        const nodes = [];
        const links = [];

        const input = stageData.materialInput || 0;
        const output = stageData.productOutput || 0;
        const waste = stageData.wasteOutput || 0;
        const byproducts = stageData.byProducts || 0;
        const emissions = stageData.emissions || 0;

        nodes.push(
            { id: 'input', name: 'Material Input', value: input, column: 0, type: 'input', unit: 't' },
            { id: 'process', name: 'Processing', value: input, column: 1, type: 'process', unit: 't' },
            { id: 'output', name: 'Product', value: output, column: 2, type: 'output', unit: 't' },
            { id: 'byproducts', name: 'By-Products', value: byproducts, column: 2, type: 'output', unit: 't' },
            { id: 'waste', name: 'Waste', value: waste, column: 2, type: 'waste', unit: 't' },
            { id: 'emissions', name: 'Emissions', value: emissions / 100, column: 2, type: 'waste', unit: 'kg' }
        );

        links.push(
            { source: 'input', target: 'process', value: input },
            { source: 'process', target: 'output', value: output },
            { source: 'process', target: 'byproducts', value: byproducts },
            { source: 'process', target: 'waste', value: waste },
            { source: 'process', target: 'emissions', value: emissions / 100 }
        );

        return { nodes, links };
    };

    const COLORS = ['#00B894', '#FD79A8', '#FDCB6E', '#6C5CE7', '#74B9FF'];

    // Generate stage-specific visualizations
    const generateStageVisualizations = (stage, stageIndex) => {
        const stageData = stage.data;
        
        // Bauxite Mining - Mining yield line chart, radar chart for impacts, pie for costs
        if (stageIndex === 0) {
            const yieldData = [
                { month: 'Jan', yield: 72, target: 76 },
                { month: 'Feb', yield: 74, target: 76 },
                { month: 'Mar', yield: 75, target: 76 },
                { month: 'Apr', yield: 76, target: 76 },
                { month: 'May', yield: 78, target: 76 },
                { month: 'Jun', yield: 76, target: 76 }
            ];

            const impactData = [
                { metric: 'Water', value: stageData.waterEfficiency || 25, fullMark: 100 },
                { metric: 'Energy', value: stageData.energyEfficiency || 69, fullMark: 100 },
                { metric: 'Emissions', value: 100 - ((stageData.emissions || 2500) / 50), fullMark: 100 },
                { metric: 'Waste', value: 100 - ((stageData.wasteOutput || 550) / 10), fullMark: 100 },
                { metric: 'Safety', value: 85, fullMark: 100 }
            ];

            const costData = [
                { name: 'Operating', value: stageData.operatingCost || 1200000, color: '#BA7967' },
                { name: 'Maintenance', value: stageData.maintenanceCost || 180000, color: '#95E1D3' },
                { name: 'Capital', value: (stageData.capitalCost || 2100000) / 10, color: '#FF9F1C' }
            ];

            return (
                <div className="space-y-6">
                    {/* Mining Yield Line Chart */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Mining Yield Efficiency Trend</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[70, 80]} />
                                <Tooltip 
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="yield" stroke="#BA7967" strokeWidth={3} name="Actual Yield" dot={{ r: 5 }} />
                                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Environmental Impact Radar */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Environmental Impact Assessment</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={impactData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Radar name="Performance" dataKey="value" stroke="#BA7967" fill="#BA7967" fillOpacity={0.6} />
                                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cost Distribution Pie */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Cost Distribution</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={costData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {costData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            );
        }

        // Alumina Refining - Process flow, bar for red mud/emissions
        if (stageIndex === 1) {
            const processFlowData = [
                { step: 'Digestion', efficiency: 95, energy: 5200 },
                { step: 'Clarification', efficiency: 88, energy: 1200 },
                { step: 'Precipitation', efficiency: 92, energy: 1800 },
                { step: 'Calcination', efficiency: 90, energy: 3500 }
            ];

            const byproductData = [
                { category: 'Red Mud', linear: 1200, circular: 450, reduction: 62.5 },
                { category: 'CO₂ Emissions', linear: 3200, circular: 1100, reduction: 65.6 },
                { category: 'Wastewater', linear: 2800, circular: 950, reduction: 66.1 }
            ];

            return (
                <div className="space-y-6">
                    {/* Process Flow Visualization */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Bayer Process Flow Stages</h6>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                            {processFlowData.map((step, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-md flex items-center justify-center mb-2">
                                            <div className="text-2xl font-bold text-[#BA7967]">{step.efficiency}%</div>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-900">{step.step}</div>
                                        <div className="text-xs text-gray-600">{step.energy} MJ</div>
                                    </div>
                                    {idx < processFlowData.length - 1 && (
                                        <svg className="w-8 h-8 text-[#BA7967]" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Red Mud & Emissions Bar Chart */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Byproduct & Emissions Comparison</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byproductData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip 
                                    formatter={(value, name) => [`${value} kg`, name === 'linear' ? 'Linear Model' : 'Circular Model']}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="linear" fill="#EF4444" name="Linear Model" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="circular" fill="#22C55E" name="Circular Model" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-center text-sm text-green-700 bg-green-50 p-2 rounded">
                            Average reduction: {(byproductData.reduce((sum, d) => sum + d.reduction, 0) / byproductData.length).toFixed(1)}% with circular economy
                        </div>
                    </div>
                </div>
            );
        }

        // Anode Production - Gauge for efficiency, trend line for energy
        if (stageIndex === 2) {
            const efficiencyGaugeData = [
                { name: 'Efficiency', value: stageData.processEfficiency || 72, fill: '#BA7967' }
            ];

            const energyTrendData = [
                { week: 'W1', energy: 4900, baseline: 5000 },
                { week: 'W2', energy: 4850, baseline: 5000 },
                { week: 'W3', energy: 4800, baseline: 5000 },
                { week: 'W4', energy: 4750, baseline: 5000 },
                { week: 'W5', energy: 4700, baseline: 5000 },
                { week: 'W6', energy: 4650, baseline: 5000 }
            ];

            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Production Efficiency Gauge */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Production Efficiency Gauge</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadialBarChart 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius="60%" 
                                    outerRadius="90%" 
                                    data={efficiencyGaugeData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar 
                                        background 
                                        dataKey="value" 
                                        cornerRadius={10}
                                        fill="#BA7967"
                                    />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-gray-900">
                                        {efficiencyGaugeData[0].value}%
                                    </text>
                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-600">
                                        Current Efficiency
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="flex justify-between text-xs text-gray-600 px-4">
                                <span>0%</span>
                                <span className="text-green-600 font-semibold">Target: 75%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Energy Consumption Trend */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Energy Consumption Trend</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={energyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[4600, 5100]} />
                                    <Tooltip 
                                        formatter={(value) => `${value} MJ`}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="energy" stroke="#BA7967" strokeWidth={3} name="Actual Energy" dot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="baseline" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" name="Baseline" />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="mt-3 text-center text-sm text-green-700 bg-green-50 p-2 rounded">
                                ↓ 7% energy reduction achieved over 6 weeks
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Smelting - Gauge for efficiency, trend line for energy
        if (stageIndex === 3) {
            const smeltingEfficiencyData = [
                { name: 'Efficiency', value: stageData.processEfficiency || 85, fill: '#FF9F1C' }
            ];

            const powerConsumptionData = [
                { hour: '00:00', power: 14500, temp: 960 },
                { hour: '04:00', power: 14800, temp: 965 },
                { hour: '08:00', power: 15200, temp: 970 },
                { hour: '12:00', power: 15000, temp: 968 },
                { hour: '16:00', power: 14900, temp: 966 },
                { hour: '20:00', power: 14700, temp: 963 }
            ];

            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Smelting Efficiency Gauge */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Electrolysis Efficiency</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadialBarChart 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius="60%" 
                                    outerRadius="90%" 
                                    data={smeltingEfficiencyData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar 
                                        background 
                                        dataKey="value" 
                                        cornerRadius={10}
                                        fill="#FF9F1C"
                                    />
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-gray-900">
                                        {smeltingEfficiencyData[0].value}%
                                    </text>
                                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-600">
                                        Process Efficiency
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-orange-50 rounded text-center">
                                    <div className="font-semibold text-orange-900">Current Density</div>
                                    <div className="text-orange-700">0.95 A/cm²</div>
                                </div>
                                <div className="p-2 bg-blue-50 rounded text-center">
                                    <div className="font-semibold text-blue-900">Cell Voltage</div>
                                    <div className="text-blue-700">4.2 V</div>
                                </div>
                            </div>
                        </div>

                        {/* Power & Temperature Trend */}
                        <div>
                            <h6 className="text-sm font-semibold text-gray-900 mb-3">Power Consumption & Temperature</h6>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={powerConsumptionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[14000, 16000]} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[955, 975]} />
                                    <Tooltip 
                                        formatter={(value, name) => [
                                            name === 'power' ? `${value} kW` : `${value}°C`,
                                            name === 'power' ? 'Power' : 'Temperature'
                                        ]}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="power" stroke="#FF9F1C" strokeWidth={3} name="Power (kW)" dot={{ r: 5 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={2} name="Temperature (°C)" dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            );
        }

        // Casting & Fabrication - Yield bars, quality metrics
        if (stageIndex === 4) {
            const yieldData = [
                { product: 'Ingots', linear: 88, circular: 95 },
                { product: 'Sheets', linear: 85, circular: 92 },
                { product: 'Extrusions', linear: 82, circular: 90 },
                { product: 'Wire', linear: 86, circular: 93 }
            ];

            const qualityScatterData = [
                { strength: 280, ductility: 12, size: 100, category: 'Excellent' },
                { strength: 270, ductility: 13, size: 120, category: 'Good' },
                { strength: 290, ductility: 11, size: 90, category: 'Excellent' },
                { strength: 265, ductility: 14, size: 110, category: 'Good' },
                { strength: 285, ductility: 12.5, size: 105, category: 'Excellent' },
                { strength: 275, ductility: 13.5, size: 95, category: 'Good' }
            ];

            return (
                <div className="space-y-6">
                    {/* Product Yield Comparison */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Product Yield by Category</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="product" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[75, 100]} />
                                <Tooltip 
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="linear" fill="#EF4444" name="Linear Process" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="circular" fill="#22C55E" name="Circular Process" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quality Metrics Scatter */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Quality Metrics: Strength vs Ductility</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="strength" name="Tensile Strength" unit=" MPa" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[260, 295]} />
                                <YAxis type="number" dataKey="ductility" name="Ductility" unit="%" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[10, 15]} />
                                <ZAxis type="number" dataKey="size" range={[100, 400]} />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Scatter name="Product Quality" data={qualityScatterData} fill="#BA7967" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // Use Phase - Lifecycle performance, durability
        if (stageIndex === 5) {
            const lifecycleData = [
                { year: 'Y0', performance: 100, maintenance: 0 },
                { year: 'Y2', performance: 98, maintenance: 2 },
                { year: 'Y5', performance: 95, maintenance: 5 },
                { year: 'Y10', performance: 90, maintenance: 10 },
                { year: 'Y15', performance: 85, maintenance: 18 },
                { year: 'Y20', performance: 78, maintenance: 28 }
            ];

            const applicationData = [
                { sector: 'Automotive', usage: 35, efficiency: 92 },
                { sector: 'Construction', usage: 28, efficiency: 88 },
                { sector: 'Packaging', usage: 18, efficiency: 85 },
                { sector: 'Electronics', usage: 12, efficiency: 95 },
                { sector: 'Aerospace', usage: 7, efficiency: 98 }
            ];

            return (
                <div className="space-y-6">
                    {/* Lifecycle Performance */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Product Lifecycle Performance</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={lifecycleData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[70, 105]} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 30]} />
                                <Tooltip 
                                    formatter={(value, name) => [
                                        name === 'performance' ? `${value}%` : `${value}%`,
                                        name === 'performance' ? 'Performance' : 'Maintenance'
                                    ]}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="performance" stroke="#22C55E" strokeWidth={3} name="Performance Retention" dot={{ r: 5 }} />
                                <Line yAxisId="right" type="monotone" dataKey="maintenance" stroke="#F59E0B" strokeWidth={2} name="Maintenance Required" dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Application Sectors */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Application Sector Distribution</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={applicationData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis type="category" dataKey="sector" tick={{ fontSize: 12 }} stroke="#6b7280" width={100} />
                                <Tooltip 
                                    formatter={(value, name) => [
                                        name === 'usage' ? `${value}%` : `${value}%`,
                                        name === 'usage' ? 'Market Share' : 'Efficiency'
                                    ]}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="usage" fill="#6C5CE7" name="Market Share (%)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="efficiency" fill="#00B894" name="Efficiency (%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        // Recycling & EOL - Recovery rates, material flow
        if (stageIndex === 6) {
            const recoveryData = [
                { material: 'Pure Al', linear: 15, circular: 82 },
                { material: 'Alloys', linear: 12, circular: 78 },
                { material: 'Composites', linear: 8, circular: 65 },
                { material: 'Scrap', linear: 20, circular: 88 }
            ];

            const energySavingsData = [
                { process: 'Collection', energy: 120, savings: 0 },
                { process: 'Sorting', energy: 180, savings: 15 },
                { process: 'Processing', energy: 450, savings: 78 },
                { process: 'Remelting', energy: 800, savings: 92 },
                { process: 'Refining', energy: 350, savings: 85 }
            ];

            return (
                <div className="space-y-6">
                    {/* Material Recovery Rates */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Material Recovery Rates by Type</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={recoveryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="material" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                                <Tooltip 
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="linear" fill="#EF4444" name="Linear Economy" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="circular" fill="#00B894" name="Circular Economy" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-center text-sm text-green-700 bg-green-50 p-2 rounded">
                            ↑ Average 65% improvement in material recovery with circular processes
                        </div>
                    </div>

                    {/* Energy Savings Scatter */}
                    <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-3">Energy Consumption vs Savings Potential</h6>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" dataKey="energy" name="Energy Use" unit=" MJ" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis type="number" dataKey="savings" name="Savings" unit="%" tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 100]} />
                                <ZAxis type="number" range={[100, 500]} />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }}
                                    formatter={(value, name) => [
                                        name === 'energy' ? `${value} MJ` : `${value}%`,
                                        name
                                    ]}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Scatter name="Process Steps" data={energySavingsData} fill="#00B894">
                                    {energySavingsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="process-stages space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aluminum Production Process Flow</h2>
                        <p className="text-gray-600">Seven-stage lifecycle analysis from mining to recycling</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#BA7967]">
                            {stagesWithData.length}
                        </div>
                        <div className="text-sm text-gray-600">Production Stages</div>
                    </div>
                </div>
            </div>

            {/* Efficiency Benchmarking Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#BA7967]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Process Efficiency Benchmarking
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={benchmarkData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                            formatter={(value) => `${value.toFixed(1)}%`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="actual" fill="#BA7967" name="Current Performance" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="industry" fill="#94A3B8" name="Industry Average" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Vertical Process Flow Diagram */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Production Process Flow</h3>
                
                <div className="relative">
                    {stagesWithData.map((stage, index) => (
                        <div key={stage.id} className="relative">
                            {/* Stage Card */}
                            <div 
                                className={`
                                    mb-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
                                    ${expandedStage === stage.id 
                                        ? 'border-[#BA7967] shadow-lg' 
                                        : 'border-gray-200 hover:border-[#BA7967]/50 hover:shadow-md'
                                    }
                                `}
                                onClick={() => toggleStage(stage.id)}
                            >
                                {/* Stage Header */}
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                                style={{ backgroundColor: `${stage.color}20` }}
                                            >
                                                {stage.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-500">Stage {stage.stageNumber}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-[#BA7967]/10 text-[#BA7967] rounded-full">
                                                        {mode === 'linear' ? 'Linear' : 'Circular'}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">{stage.name}</h4>
                                                <p className="text-sm text-gray-600">{stage.description}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Quick Metrics */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Efficiency</div>
                                                <div className="text-xl font-bold text-[#BA7967]">
                                                    {(stage.data.processEfficiency || stage.metrics.efficiency || 70).toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Energy</div>
                                                <div className="text-xl font-bold text-gray-900">
                                                    {stage.energyIntensity} <span className="text-sm font-normal">GJ/t</span>
                                                </div>
                                            </div>
                                            <svg 
                                                className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                                                    expandedStage === stage.id ? 'rotate-180' : ''
                                                }`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedStage === stage.id && (
                                    <div className="p-6 border-t border-gray-200 bg-white">
                                        {/* Stage-Specific Sankey Diagram */}
                                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                            <h5 className="text-sm font-semibold text-gray-900 mb-3">Material & Waste Flow</h5>
                                            <SankeyDiagram
                                                data={generateStageSankeyData(stage.data)}
                                                width={700}
                                                height={300}
                                                onNodeClick={(node) => setSelectedSankeyNode(node)}
                                            />
                                            {selectedSankeyNode && (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="font-semibold text-blue-900">{selectedSankeyNode.name}:</span>
                                                            <span className="text-blue-700 ml-2">
                                                                {selectedSankeyNode.value.toLocaleString()} {selectedSankeyNode.unit}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedSankeyNode(null)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stage-Specific Visualizations */}
                                        <div className="mb-6">
                                            {generateStageVisualizations(stage, index)}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                                            {/* Key Metrics */}
                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Key Performance Metrics</h5>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-600">Material Input</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {(stage.data.materialInput || 0).toLocaleString()} kg
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-600">Product Output</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {(stage.data.productOutput || 0).toLocaleString()} kg
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-600">Energy Consumption</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {(stage.data.energyInput || 0).toLocaleString()} MJ
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-600">Water Usage</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {(stage.data.waterInput || 0).toLocaleString()} L
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-sm text-gray-600">CO₂ Emissions</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {(stage.data.emissions || 0).toLocaleString()} kg
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                        <span className="text-sm text-green-700">Yield Efficiency</span>
                                                        <span className="text-sm font-semibold text-green-700">
                                                            {(stage.data.yieldEfficiency || 0).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Efficiency Breakdown - Pie Chart */}
                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Efficiency Distribution</h5>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Energy', value: stage.data.energyEfficiency || 65 },
                                                                { name: 'Water', value: stage.data.waterEfficiency || 25 },
                                                                { name: 'Process', value: stage.data.processEfficiency || 72 },
                                                                { name: 'Yield', value: stage.data.yieldEfficiency || 76 }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {COLORS.map((color, index) => (
                                                                <Cell key={`cell-${index}`} fill={color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                                    </PieChart>
                                                </ResponsiveContainer>

                                                {/* Operating Parameters */}
                                                {stage.data.recommendedParameters && (
                                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                                        <h6 className="text-xs font-semibold text-blue-900 mb-2">Recommended Parameters</h6>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-blue-600">Temperature:</span>
                                                                <span className="ml-2 text-blue-900 font-medium">
                                                                    {stage.data.recommendedParameters.temperature}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-blue-600">Pressure:</span>
                                                                <span className="ml-2 text-blue-900 font-medium">
                                                                    {stage.data.recommendedParameters.pressure}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-blue-600">Flow Rate:</span>
                                                                <span className="ml-2 text-blue-900 font-medium">
                                                                    {stage.data.recommendedParameters.flowRate}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cost Analysis */}
                                            <div className="lg:col-span-2">
                                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Cost Analysis</h5>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                                                        <div className="text-xs text-gray-600 mb-1">Operating Cost</div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            ${((stage.data.operatingCost || 0) / 1000000).toFixed(2)}M
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg">
                                                        <div className="text-xs text-gray-600 mb-1">Capital Cost</div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            ${((stage.data.capitalCost || 0) / 1000000).toFixed(2)}M
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                                        <div className="text-xs text-gray-600 mb-1">Maintenance Cost</div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            ${((stage.data.maintenanceCost || 0) / 1000).toFixed(0)}k
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Optimization Potential */}
                                                {stage.data.optimizationPotential && (
                                                    <div className="mt-4 p-4 bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg border border-[#BA7967]/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-semibold text-gray-900">Optimization Potential</span>
                                                            <span className="text-2xl font-bold text-[#BA7967]">
                                                                {stage.data.optimizationPotential}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-[#BA7967] h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${stage.data.optimizationPotential}%` }}
                                                            ></div>
                                                        </div>
                                                        {stage.data.expectedSavings && (
                                                            <div className="mt-2 text-xs text-gray-600">
                                                                Expected savings: <span className="font-semibold text-green-700">
                                                                    ${(stage.data.expectedSavings / 1000).toFixed(0)}k
                                                                </span> with ${(stage.data.implementationCost / 1000).toFixed(0)}k investment
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Arrow Connection (except for last stage) */}
                            {index < stagesWithData.length - 1 && (
                                <div className="flex justify-center my-2">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-6 h-8 text-[#BA7967]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)" />
                                        </svg>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {stage.data.productOutput ? `${stage.data.productOutput.toLocaleString()} kg` : 'Material Flow'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Circular Economy Loop Indicator */}
                    {mode === 'circular' && (
                        <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 border-dashed rounded-lg">
                            <div className="flex items-center justify-center gap-3">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <div>
                                    <div className="text-sm font-semibold text-green-900">Circular Material Flow Active</div>
                                    <div className="text-xs text-green-700">
                                        {selectedProject.circularModel?.recyclingRate?.toFixed(0)}% of materials return to the production cycle
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Total Energy</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {productionStages.reduce((sum, s) => sum + (s.energyInput || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">MJ consumed</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Total Emissions</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {productionStages.reduce((sum, s) => sum + (s.emissions || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">kg CO₂e</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Average Efficiency</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(productionStages.reduce((sum, s) => sum + (s.processEfficiency || 0), 0) / productionStages.length).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Across all stages</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                    <div className="text-2xl font-bold text-[#BA7967]">
                        ${(productionStages.reduce((sum, s) => sum + (s.capitalCost || 0), 0) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Capital expenditure</div>
                </div>
            </div>
        </div>
    );
}
