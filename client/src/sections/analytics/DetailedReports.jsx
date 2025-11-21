import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    ScatterChart, Scatter, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';
import { saveAs } from 'file-saver';
import { Download, ChevronUp, ChevronDown, Filter, BarChart3, Table as TableIcon } from 'lucide-react';

export default function DetailedReports({ mode, selectedProject }) {
    const [activeView, setActiveView] = useState('table'); // 'table', 'chart', 'stats'
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filterStage, setFilterStage] = useState('all');
    const [selectedMetric, setSelectedMetric] = useState('cost');
    const [chartType, setChartType] = useState('bar');

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view detailed reports
            </div>
        );
    }

    const stages = selectedProject.productionStages || [];
    const linearModel = selectedProject.linearModel || {};
    const circularModel = selectedProject.circularModel || {};

    // Filter stages
    const filteredStages = filterStage === 'all' 
        ? stages 
        : stages.filter(stage => stage.stageId === filterStage);

    // Sorting function
    const sortData = (data, key) => {
        if (!key) return data;
        
        return [...data].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            return sortConfig.direction === 'asc' 
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStages = useMemo(() => 
        sortData(filteredStages, sortConfig.key),
        [filteredStages, sortConfig]
    );

    // Get chart data based on selected metric
    const getChartData = () => {
        const metricMap = {
            cost: mode === 'circular' ? 'circularMetrics' : 'linearMetrics',
            emissions: 'emissions',
            efficiency: 'processEfficiency',
            yield: 'yieldEfficiency',
            energy: 'energyEfficiency',
            water: 'waterEfficiency'
        };

        return sortedStages.map(stage => {
            let value;
            if (selectedMetric === 'cost') {
                value = mode === 'circular' 
                    ? stage.circularMetrics?.cost 
                    : stage.linearMetrics?.cost;
            } else if (selectedMetric === 'emissions') {
                value = stage.emissions;
            } else if (selectedMetric === 'efficiency') {
                value = stage.processEfficiency;
            } else if (selectedMetric === 'yield') {
                value = stage.yieldEfficiency;
            } else if (selectedMetric === 'energy') {
                value = stage.energyEfficiency;
            } else if (selectedMetric === 'water') {
                value = stage.waterEfficiency;
            }

            return {
                name: stage.stageName,
                value: value || 0,
                stage: stage.stageName
            };
        });
    };

    // Calculate correlation matrix
    const calculateCorrelations = () => {
        const metrics = ['emissions', 'energyEfficiency', 'waterEfficiency', 'processEfficiency', 'yieldEfficiency'];
        const correlations = [];

        metrics.forEach((metricX, i) => {
            metrics.forEach((metricY, j) => {
                const correlation = calculatePearsonCorrelation(
                    stages.map(s => s[metricX] || 0),
                    stages.map(s => s[metricY] || 0)
                );
                correlations.push({
                    x: i,
                    y: j,
                    metricX,
                    metricY,
                    value: correlation
                });
            });
        });

        return correlations;
    };

    const calculatePearsonCorrelation = (x, y) => {
        const n = x.length;
        if (n === 0) return 0;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    };

    // Export functions
    const exportToJSON = () => {
        const exportData = {
            projectName: selectedProject.projectName,
            analysisDate: selectedProject.analysisDate,
            mode: mode,
            linearModel: linearModel,
            circularModel: circularModel,
            productionStages: filteredStages,
            aiRecommendations: selectedProject.aiRecommendations
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        saveAs(blob, `${selectedProject.projectName}-report-${mode}.json`);
    };

    const exportToCSV = () => {
        const headers = [
            'Stage Name',
            'Material Input',
            'Energy Input',
            'Water Input',
            'Product Output',
            'Emissions',
            'Yield Efficiency',
            'Energy Efficiency',
            'Water Efficiency',
            'Process Efficiency',
            'Operating Cost',
            'Capital Cost',
            'Optimization Potential'
        ];

        const rows = filteredStages.map(stage => [
            stage.stageName,
            stage.materialInput,
            stage.energyInput,
            stage.waterInput,
            stage.productOutput,
            stage.emissions,
            stage.yieldEfficiency,
            stage.energyEfficiency,
            stage.waterEfficiency,
            stage.processEfficiency,
            stage.operatingCost,
            stage.capitalCost,
            stage.optimizationPotential
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${selectedProject.projectName}-data-${mode}.csv`);
    };

    // Render chart based on selected type
    const renderChart = () => {
        const data = getChartData();
        const commonProps = {
            data,
            margin: { top: 20, right: 30, left: 20, bottom: 60 }
        };

        const xAxisProps = {
            dataKey: 'name',
            angle: -45,
            textAnchor: 'end',
            height: 100,
            tick: { fill: '#6B7280', fontSize: 11 }
        };

        const yAxisProps = {
            tick: { fill: '#6B7280', fontSize: 12 }
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisProps} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Bar dataKey="value" fill="#BA7967" name={selectedMetric} />
                    </BarChart>
                );
            
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisProps} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#BA7967" 
                            strokeWidth={3}
                            name={selectedMetric}
                            dot={{ fill: '#BA7967', r: 5 }}
                        />
                    </LineChart>
                );
            
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisProps} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#BA7967" 
                            fill="#BA7967" 
                            fillOpacity={0.3}
                            strokeWidth={2}
                            name={selectedMetric}
                        />
                    </AreaChart>
                );
            
            case 'pie':
                const COLORS = ['#BA7967', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={(entry) => entry.name}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            
            default:
                return null;
        }
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) {
            return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
        }
        return sortConfig.direction === 'asc' 
            ? <ChevronUp className="w-4 h-4 text-[#BA7967]" />
            : <ChevronDown className="w-4 h-4 text-[#BA7967]" />;
    };

    return (
        <div className="detailed-reports space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detailed Analytics Reports</h2>
                        <p className="text-gray-600">
                            {selectedProject.projectName} - {mode === 'circular' ? 'Circular' : 'Linear'} Model Analysis
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToJSON}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export JSON
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* View Toggle & Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* View Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('table')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeView === 'table'
                                    ? 'bg-[#BA7967] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <TableIcon className="w-4 h-4" />
                            Data Table
                        </button>
                        <button
                            onClick={() => setActiveView('chart')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeView === 'chart'
                                    ? 'bg-[#BA7967] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Custom Chart
                        </button>
                        <button
                            onClick={() => setActiveView('stats')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                activeView === 'stats'
                                    ? 'bg-[#BA7967] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Statistics
                        </button>
                    </div>

                    {/* Stage Filter */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter Stage:</label>
                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                        >
                            <option value="all">All Stages</option>
                            {stages.map(stage => (
                                <option key={stage.stageId} value={stage.stageId}>
                                    {stage.stageName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Data Table View */}
            {activeView === 'table' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {[
                                        { key: 'stageName', label: 'Stage Name' },
                                        { key: 'materialInput', label: 'Material Input (t)' },
                                        { key: 'energyInput', label: 'Energy (MJ)' },
                                        { key: 'waterInput', label: 'Water (L)' },
                                        { key: 'productOutput', label: 'Output (t)' },
                                        { key: 'emissions', label: 'Emissions (kg)' },
                                        { key: 'yieldEfficiency', label: 'Yield (%)' },
                                        { key: 'energyEfficiency', label: 'Energy Eff (%)' },
                                        { key: 'processEfficiency', label: 'Process Eff (%)' },
                                        { key: 'operatingCost', label: 'Op Cost ($)' }
                                    ].map(({ key, label }) => (
                                        <th
                                            key={key}
                                            onClick={() => requestSort(key)}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                {label}
                                                <SortIcon column={key} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedStages.map((stage, idx) => (
                                    <tr key={stage.stageId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{stage.stageName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{stage.materialInput.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{stage.energyInput.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{stage.waterInput.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{stage.productOutput.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">{stage.emissions.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-green-600 font-semibold">{stage.yieldEfficiency}%</td>
                                        <td className="px-4 py-3 text-sm text-blue-600 font-semibold">{stage.energyEfficiency}%</td>
                                        <td className="px-4 py-3 text-sm text-purple-600 font-semibold">{stage.processEfficiency}%</td>
                                        <td className="px-4 py-3 text-sm text-orange-600 font-semibold">
                                            ${stage.operatingCost.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Row */}
                    <div className="bg-gray-50 border-t border-gray-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                                <div className="text-gray-600">Total Material Input</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {sortedStages.reduce((sum, s) => sum + s.materialInput, 0).toLocaleString()} t
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Total Energy</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {sortedStages.reduce((sum, s) => sum + s.energyInput, 0).toLocaleString()} MJ
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Total Emissions</div>
                                <div className="text-lg font-bold text-red-600">
                                    {sortedStages.reduce((sum, s) => sum + s.emissions, 0).toLocaleString()} kg
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Avg Yield Efficiency</div>
                                <div className="text-lg font-bold text-green-600">
                                    {(sortedStages.reduce((sum, s) => sum + s.yieldEfficiency, 0) / sortedStages.length).toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-600">Total Operating Cost</div>
                                <div className="text-lg font-bold text-orange-600">
                                    ${sortedStages.reduce((sum, s) => sum + s.operatingCost, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Chart Builder View */}
            {activeView === 'chart' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Chart Builder</h3>
                    
                    {/* Chart Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                            >
                                <option value="cost">Cost</option>
                                <option value="emissions">Emissions</option>
                                <option value="efficiency">Process Efficiency</option>
                                <option value="yield">Yield Efficiency</option>
                                <option value="energy">Energy Efficiency</option>
                                <option value="water">Water Efficiency</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                                <option value="pie">Pie Chart</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900">
                                {mode === 'circular' ? 'Circular Economy' : 'Linear Economy'}
                            </div>
                        </div>
                    </div>

                    {/* Chart Display */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <ResponsiveContainer width="100%" height={400}>
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Statistical Analysis View */}
            {activeView === 'stats' && (
                <div className="space-y-6">
                    {/* Correlation Heatmap */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Correlation Matrix</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Pearson correlation coefficients between key metrics. 
                            <span className="font-semibold"> Values range from -1 (negative) to +1 (positive correlation).</span>
                        </p>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200"></th>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200">Emissions</th>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200">Energy Eff</th>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200">Water Eff</th>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200">Process Eff</th>
                                        <th className="p-2 text-xs font-semibold text-gray-900 border border-gray-200">Yield Eff</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['emissions', 'energyEfficiency', 'waterEfficiency', 'processEfficiency', 'yieldEfficiency'].map((metricY, i) => (
                                        <tr key={metricY}>
                                            <td className="p-2 text-xs font-semibold text-gray-900 border border-gray-200 bg-gray-50">
                                                {metricY === 'emissions' ? 'Emissions' :
                                                 metricY === 'energyEfficiency' ? 'Energy Eff' :
                                                 metricY === 'waterEfficiency' ? 'Water Eff' :
                                                 metricY === 'processEfficiency' ? 'Process Eff' : 'Yield Eff'}
                                            </td>
                                            {['emissions', 'energyEfficiency', 'waterEfficiency', 'processEfficiency', 'yieldEfficiency'].map((metricX, j) => {
                                                const correlation = calculatePearsonCorrelation(
                                                    stages.map(s => s[metricY] || 0),
                                                    stages.map(s => s[metricX] || 0)
                                                );
                                                const absCorr = Math.abs(correlation);
                                                const bgColor = absCorr > 0.7 ? 'bg-red-100' : absCorr > 0.4 ? 'bg-yellow-100' : 'bg-green-100';
                                                
                                                return (
                                                    <td key={`${i}-${j}`} className={`p-2 text-center text-xs font-semibold border border-gray-200 ${bgColor}`}>
                                                        {correlation.toFixed(2)}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-100 border border-gray-300"></div>
                                <span>Strong (|r| &gt; 0.7)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-100 border border-gray-300"></div>
                                <span>Moderate (0.4 &lt; |r| &lt; 0.7)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-gray-300"></div>
                                <span>Weak (|r| &lt; 0.4)</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Descriptive Statistics</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Emissions', key: 'emissions', unit: 'kg' },
                                    { label: 'Energy Efficiency', key: 'energyEfficiency', unit: '%' },
                                    { label: 'Process Efficiency', key: 'processEfficiency', unit: '%' },
                                    { label: 'Yield Efficiency', key: 'yieldEfficiency', unit: '%' }
                                ].map(({ label, key, unit }) => {
                                    const values = stages.map(s => s[key] || 0);
                                    const mean = values.reduce((a, b) => a + b, 0) / values.length;
                                    const min = Math.min(...values);
                                    const max = Math.max(...values);
                                    const stdDev = Math.sqrt(
                                        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
                                    );

                                    return (
                                        <div key={key} className="border border-gray-200 rounded-lg p-3">
                                            <div className="font-semibold text-gray-900 mb-2">{label}</div>
                                            <div className="grid grid-cols-4 gap-2 text-xs">
                                                <div>
                                                    <div className="text-gray-600">Mean</div>
                                                    <div className="font-bold text-gray-900">{mean.toFixed(1)} {unit}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Min</div>
                                                    <div className="font-bold text-gray-900">{min.toFixed(1)} {unit}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Max</div>
                                                    <div className="font-bold text-gray-900">{max.toFixed(1)} {unit}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">Std Dev</div>
                                                    <div className="font-bold text-gray-900">{stdDev.toFixed(1)} {unit}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Model Comparison */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Linear vs Circular Comparison</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Total Cost', linear: linearModel.totalCost, circular: circularModel.totalCost, format: 'currency' },
                                    { label: 'Total Emissions', linear: linearModel.totalEmissions, circular: circularModel.totalEmissions, format: 'number' },
                                    { label: 'Energy Consumption', linear: linearModel.energyConsumption, circular: circularModel.energyConsumption, format: 'number' },
                                    { label: 'Resource Efficiency', linear: linearModel.resourceEfficiency, circular: circularModel.resourceEfficiency, format: 'percent' },
                                    { label: 'Recycling Rate', linear: linearModel.recyclingRate, circular: circularModel.recyclingRate, format: 'percent' }
                                ].map(({ label, linear, circular, format }) => {
                                    const improvement = ((circular - linear) / linear * 100);
                                    const isPositive = improvement > 0;
                                    
                                    return (
                                        <div key={label} className="border border-gray-200 rounded-lg p-3">
                                            <div className="font-semibold text-gray-900 mb-2">{label}</div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm">
                                                    <div className="text-gray-600">Linear</div>
                                                    <div className="font-bold text-red-600">
                                                        {format === 'currency' ? `$${linear?.toLocaleString()}` :
                                                         format === 'percent' ? `${linear}%` : linear?.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isPositive ? '+' : ''}{improvement.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="text-sm text-right">
                                                    <div className="text-gray-600">Circular</div>
                                                    <div className="font-bold text-green-600">
                                                        {format === 'currency' ? `$${circular?.toLocaleString()}` :
                                                         format === 'percent' ? `${circular}%` : circular?.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
