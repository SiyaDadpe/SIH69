import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectSelector from '../sections/analytics/ProjectSelector';
import Header from '../sections/analytics/Header';
import TabbedDashboard from '../sections/analytics/TabbedDashboard';
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

        // aggregate metrics
        totalGWP: doc.totalCO2Emissions || 0,
        totalEnergy: doc.totalEnergyConsumption || 0,
        totalWater: doc.totalWaterUsage || 0,
        circularityScore: doc.circularityScore || 0,
        circularityRating: doc.circularityRating || 'Unknown',

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

        // metadata
        calculatedAt: doc.analysisDate?.$date || doc.createdAt?.$date,
        status: doc.status,
        metalType: doc.metalType,
        pdfUrl: doc.pdfReportUrl,
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
    const reportId = searchParams.get('reportId');
    
    const [projectData, setProjectData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [mode, setMode] = useState('circular');
    const [activeTab, setActiveTab] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch project analytics data
        const fetchProjectData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                if (reportId) {
                    // First try enriched calculatelca document
                    console.log('📊 Fetching calculatelca report:', reportId);
                    try {
                        const calcRes = await getCalculatelcaById(reportId);
                        if (calcRes.success && calcRes.data) {
                            const analyticsData = convertCalculatelcaToAnalytics(calcRes.data);
                            console.log('✅ Calculatelca report loaded:', analyticsData);
                            setProjectData([analyticsData]);
                            setSelectedProject(analyticsData);
                            return;
                        }
                    } catch (calcErr) {
                        console.warn('⚠️ Failed to load calculatelca report, falling back to legacy:', calcErr.message);
                    }

                    // Fallback: legacy LCA report API
                    console.log('📊 Fetching legacy LCA report:', reportId);
                    const response = await getLCAReportById(reportId);
                    if (response.success && response.data) {
                        const analyticsData = convertLCAToAnalytics(response.data);
                        console.log('✅ Legacy LCA report loaded:', analyticsData);
                        setProjectData([analyticsData]);
                        setSelectedProject(analyticsData);
                    }
                } else {
                    // No reportId: show a single dummy analytics project
                    console.log('ℹ️ No reportId provided, using dummy calculatelca report');
                    const analyticsData = convertCalculatelcaToAnalytics(dummyCalculatelcaDoc);
                    setProjectData([analyticsData]);
                    setSelectedProject(analyticsData);
                    return;
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
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-[#BA7967] hover:bg-[#a86b5c] text-white px-6 py-2 rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : !projectData || projectData.length === 0 ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reports Available</h3>
                        <p className="text-gray-600 mb-4">Complete a wizard workflow to generate your first LCA report.</p>
                        <button 
                            onClick={() => window.location.href = '/wizard'}
                            className="bg-[#BA7967] hover:bg-[#a86b5c] text-white px-6 py-2 rounded-lg"
                        >
                            Go to Wizard
                        </button>
                    </div>
                </div>
            ) : (
                <>
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
        </div>
    );
}