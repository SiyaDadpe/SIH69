import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProjectSelector from '../sections/analytics/ProjectSelector';
import Header from '../sections/analytics/Header';
import TabbedDashboard from '../sections/analytics/TabbedDashboard';
import FloatingChatbot from '../components/FloatingChatbot';
import { getLCAReportById, getUserLCAReports, getCalculatelcaById } from '../services/lcaService';

// Single dummy calculatelca-style report used when no real reportId is provided
const dummyCalculatelcaDoc = {
    _id: 'dummy-report-1',
    workflowId: 'dummy-workflow-1',
    projectName: 'Demo Aluminum LCA',
    metalType: 'Aluminium',
    location: 'Demo Facility, IN',
    analysisDate: { $date: new Date().toISOString() },
    status: 'completed',
    totalEnergyConsumption: 18000,
    totalCO2Emissions: 21000,
    totalWaterUsage: 5.8,
    totalWasteGeneration: 1100,
    totalAirQualityImpact: 700,
    energyIntensity: 18000,
    carbonIntensity: 21000,
    circularityScore: 52.3,
    circularityRating: 'Fair',
    materialRecoveryRate: 92,
    lcaStages: {
        mining: { energyConsumption: 500, co2Emissions: 1000, waterUsage: 0.5, wasteGeneration: 120, airQualityImpact: 25, completed: true },
        beneficiation: { energyConsumption: 1200, co2Emissions: 1500, waterUsage: 0.8, wasteGeneration: 200, airQualityImpact: 45, completed: true },
        refining: { energyConsumption: 3500, co2Emissions: 4000, waterUsage: 2.5, wasteGeneration: 400, airQualityImpact: 160, completed: true },
        smelting: { energyConsumption: 9000, co2Emissions: 11000, waterUsage: 1.0, wasteGeneration: 150, airQualityImpact: 320, completed: true },
        manufacturing: { energyConsumption: 2800, co2Emissions: 4500, waterUsage: 0.7, wasteGeneration: 140, airQualityImpact: 90, completed: true },
        recycling: { energyConsumption: 1200, co2Emissions: 0, waterUsage: 0.3, wasteGeneration: 70, airQualityImpact: 35, completed: true },
        valorization: { energyConsumption: 300, co2Emissions: 0, waterUsage: 0.5, wasteGeneration: 30, airQualityImpact: 25, completed: true }
    },
    circularityIndex: 0.15,
    linearityIndex: 0.85,
    circularityComponents: {
        recycledContentFactor: 0.2,
        endOfLifeRecoveryFactor: 0.4,
        valorizationFactor: 0.6
    },
    sankeyData: {
        normalizationBasisTonnes: 1,
        nodes: [
            { id: 'primary', name: 'Primary Production', value: 0.7, column: 0, type: 'input', unit: 't' },
            { id: 'recycled', name: 'Recycled Input', value: 0.3, column: 0, type: 'input', unit: 't' },
            { id: 'manufacturing', name: 'Manufacturing', value: 1.0, column: 1, type: 'process', unit: 't' },
            { id: 'scrap', name: 'Manufacturing Scrap', value: 0.1, column: 2, type: 'waste', unit: 't' },
            { id: 'product', name: 'Product Use', value: 0.9, column: 2, type: 'output', unit: 't' },
            { id: 'collection', name: 'Post-use Collection', value: 0.7, column: 3, type: 'process', unit: 't' },
            { id: 'recyclingPlant', name: 'Recycling Plant', value: 0.5, column: 4, type: 'process', unit: 't' },
            { id: 'valorization', name: 'Valorization', value: 0.2, column: 4, type: 'process', unit: 't' },
            { id: 'losses', name: 'Landfill / Losses', value: 0.3, column: 4, type: 'waste', unit: 't' }
        ],
        links: [
            { source: 'primary', target: 'manufacturing', value: 0.7 },
            { source: 'recycled', target: 'manufacturing', value: 0.3 },
            { source: 'manufacturing', target: 'scrap', value: 0.1 },
            { source: 'manufacturing', target: 'product', value: 0.9 },
            { source: 'product', target: 'collection', value: 0.7 },
            { source: 'product', target: 'losses', value: 0.2 },
            { source: 'collection', target: 'recyclingPlant', value: 0.5 },
            { source: 'collection', target: 'losses', value: 0.2 },
            { source: 'recyclingPlant', target: 'recycled', value: 0.5 },
            { source: 'losses', target: 'valorization', value: 0.1 },
            { source: 'losses', target: 'losses', value: 0.2 }
        ]
    },
    recommendations: [],
    metadata: {}
};

// NOTE: earlier we used a mock calculatelca doc here for UI testing.
// Now Analytics fetches real calculatelca documents from the backend.

// Convert a document from LCA.calculatelca into the analytics format
const convertCalculatelcaToAnalytics = (doc) => {
    const stages = doc.lcaStages || {};

    return {
        // basic info
        projectName: doc.projectName || 'Aluminum LCA Project',
        location: doc.location || 'Unknown',
        timestamp: doc.analysisDate?.$date || doc.createdAt?.$date || new Date().toISOString(),
        reportId: doc._id || doc.workflowId,

        // aggregate metrics (preserve new format with value/unit objects)
        totalGWP: doc.totalCO2Emissions,
        totalEnergy: doc.totalEnergyConsumption,
        totalWater: doc.totalWaterUsage,
        totalWasteGeneration: doc.totalWasteGeneration,
        totalAirQualityImpact: doc.totalAirQualityImpact,
        totalEnergyConsumption: doc.totalEnergyConsumption,
        totalCO2Emissions: doc.totalCO2Emissions,
        totalWaterUsage: doc.totalWaterUsage,
        circularityScore: doc.circularityScore,
        circularityRating: doc.circularityRating || 'Unknown',
        materialRecoveryRate: doc.materialRecoveryRate,

        // intensity metrics (preserve new format)
        energyIntensity: doc.energyIntensity,
        carbonIntensity: doc.carbonIntensity,

        // new circularity vs linearity
        circularityIndex: doc.circularityIndex ?? null,
        linearityIndex: doc.linearityIndex ?? null,
        circularityComponents: doc.circularityComponents || null,

        // stage-wise data (keeps existing TabbedDashboard API)
        stages: {
            mining: stages.mining || {},
            beneficiation: stages.beneficiation || {},
            refining: stages.refining || {},
            smelting: stages.smelting || {},
            manufacturing: stages.manufacturing || {},
            recycling: stages.recycling || {},
            valorization: stages.valorization || {},
        },

        // sankey data for circularity flows
        sankeyData: doc.sankeyData || null,

        // AI recommendations from backend
        aiRecommendations: doc.recommendations || [],
        recommendations: doc.recommendations || [],

        // metadata
        calculatedAt: doc.analysisDate?.$date || doc.createdAt?.$date,
        status: doc.status,
        metalType: doc.metalType,
        pdfUrl: doc.pdfReportUrl,
        metadata: doc.metadata || {},
    };
};

/**
 * Convert LCA report data to analytics format
 */
const convertLCAToAnalytics = (lcaReport) => {
    // Extract data from LCA report structure
    const { stageResults = {}, aggregateResults = {}, metadata = {} } = lcaReport.calculationResults || {};
    
    return {
        projectName: lcaReport.projectName || 'Aluminum LCA Project',
        location: lcaReport.location || 'Unknown',
        timestamp: lcaReport.createdAt || new Date().toISOString(),
        reportId: lcaReport._id || lcaReport.reportId,
        
        // Aggregate metrics
        totalGWP: aggregateResults.totalGWP || 0,
        totalEnergy: aggregateResults.totalEnergyUse || 0,
        totalWater: aggregateResults.totalWaterUse || 0,
        circularityScore: aggregateResults.circularityScore || 0,
        
        // Stage-wise data
        stages: {
            mining: stageResults.mining || {},
            beneficiation: stageResults.beneficiation || {},
            refining: stageResults.refining || {},
            smelting: stageResults.smelting || {},
            manufacturing: stageResults.manufacturing || {},
            recycling: stageResults.recycling || {},
            valorization: stageResults.valorization || {}
        },
        
        // Metadata
        calculatedAt: lcaReport.createdAt,
        status: lcaReport.status,
        pdfUrl: lcaReport.pdfReportUrl
    };
};

export default function Analytics() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reportId = searchParams.get('reportId');
    
    const [projectData, setProjectData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [allReports, setAllReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mode, setMode] = useState('circular');
    const [activeTab, setActiveTab] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all user reports for workflow selector
    useEffect(() => {
        const fetchAllReports = async () => {
            try {
                const response = await getUserLCAReports();
                console.log('📊 Fetched reports response:', response);
                
                // Handle response structure: { success: true, data: { reports: [...] } }
                if (response.success && response.data && response.data.reports && Array.isArray(response.data.reports)) {
                    setAllReports(response.data.reports);
                    setFilteredReports(response.data.reports);
                } else {
                    setAllReports([]);
                    setFilteredReports([]);
                }
            } catch (err) {
                console.warn('⚠️ Failed to load user reports for selector:', err.message);
                setAllReports([]);
                setFilteredReports([]);
            }
        };
        fetchAllReports();
    }, []);

    // Search/filter reports
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredReports(allReports);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = allReports.filter(report => {
            const projectName = (report.projectName || '').toLowerCase();
            const metalType = (report.metalType || '').toLowerCase();
            const location = (report.location || '').toLowerCase();
            const date = new Date(report.createdAt).toLocaleDateString().toLowerCase();
            
            return projectName.includes(query) || 
                   metalType.includes(query) || 
                   location.includes(query) ||
                   date.includes(query);
        });
        
        setFilteredReports(filtered);
    }, [searchQuery, allReports]);

    useEffect(() => {
        // Fetch project analytics data
        const fetchProjectData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (reportId) {
                    // Fetch enriched calculatelca document
                    console.log('📊 Fetching calculatelca report:', reportId);
                    try {
                        const calcData = await getCalculatelcaById(reportId);
                        if (calcData && calcData._id) {
                            const analyticsData = convertCalculatelcaToAnalytics(calcData);
                            console.log('✅ Calculatelca report loaded:', analyticsData);
                            setProjectData([analyticsData]);
                            setSelectedProject(analyticsData);
                            return;
                        }
                    } catch (calcErr) {
                        console.error('❌ Failed to load calculatelca report:', calcErr.message);
                        setError(`Report not found: ${calcErr.message}`);
                        setLoading(false);
                        return;
                    }
                } else {
                    // No reportId: show message to select a report
                    console.log('ℹ️ No reportId provided');
                    setProjectData([]);
                    setSelectedProject(null);
                }
            } catch (error) {
                console.error('❌ Error loading analytics data:', error);
                setError(error.message || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [reportId]);

    useEffect(() => {
        if (selectedProject) {
            console.log('Selected Project:', selectedProject);
        }
    }, [selectedProject]);

    useEffect(() => {
        console.log('Analysis Mode Changed:', mode);
    }, [mode]);

    useEffect(() => {
        console.log('Active Tab Changed:', activeTab);
    }, [activeTab]);

    return (
        <div className="analytics-page min-h-screen bg-gray-50">
            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BA7967] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading analytics data...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Data</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => navigate('/analytics')}
                                className="bg-[#BA7967] hover:bg-[#a86b5c] text-white px-6 py-2 rounded-lg"
                            >
                                Select Different Workflow
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            ) : !reportId || !projectData || projectData.length === 0 ? (
                <div className="min-h-screen bg-gray-50">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 px-6 py-6">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                            <p className="text-gray-600">Select a workflow to view detailed analytics</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by project name, metal type, location, or date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-transparent shadow-sm"
                            />
                            <svg 
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="mt-3 text-sm text-gray-600">
                                Found {filteredReports.length} of {allReports.length} workflows
                            </p>
                        )}
                    </div>

                    {/* Workflows Grid */}
                    <div className="max-w-7xl mx-auto px-6 pb-12">
                        {allReports && Array.isArray(allReports) && allReports.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredReports.map((report) => (
                                    <div
                                        key={report._id}
                                        onClick={() => navigate(`/analytics?reportId=${report._id}`)}
                                        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-[#BA7967] transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                                    {report.projectName}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(report.createdAt).toLocaleDateString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                            <svg className="w-6 h-6 text-[#BA7967]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-gray-700">Metal Type:</span>
                                                <span className="px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] rounded text-xs font-medium">
                                                    {report.metalType || 'Aluminum'}
                                                </span>
                                            </div>
                                            {report.location && report.location !== 'Not specified' && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="line-clamp-1">{report.location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="capitalize">{report.status || 'completed'}</span>
                                            </div>
                                        </div>

                                        <button className="w-full bg-[#BA7967] hover:bg-[#a86b5c] text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium">
                                            View Analytics
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Available</h3>
                                <p className="text-gray-600 mb-4">Complete a wizard workflow to generate your first LCA report.</p>
                                <button 
                                    onClick={() => navigate('/wizard')}
                                    className="bg-[#BA7967] hover:bg-[#a86b5c] text-white px-6 py-2 rounded-lg"
                                >
                                    Go to Wizard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Workflow Selector Dropdown - REMOVED: Search bar, View Latest Report button, and Compare button */}
                    
                    <Header 
                        selectedProject={selectedProject}
                        mode={mode}
                        onModeChange={setMode}
                        onProjectSelect={setSelectedProject}
                        projects={projectData}
                    />
                    
                    <div className="px-6 mb-6">
                        <ProjectSelector 
                            projects={projectData} 
                            onSelect={setSelectedProject} 
                        />
                    </div>

                    <TabbedDashboard 
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        mode={mode}
                        selectedProject={selectedProject}
                    />
                </>
            )}
            <FloatingChatbot/>
        </div>
    );
}