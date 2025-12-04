import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProjectSelector from '../sections/analytics/ProjectSelector';
import Header from '../sections/analytics/Header';
import TabbedDashboard from '../sections/analytics/TabbedDashboard';
import { getLCAReportById, getUserLCAReports } from '../services/lcaService';

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
                    // Fetch specific LCA report
                    console.log('📊 Fetching LCA report:', reportId);
                    const response = await getLCAReportById(reportId);
                    
                    if (response.success && response.data) {
                        const analyticsData = convertLCAToAnalytics(response.data);
                        console.log('✅ LCA report loaded:', analyticsData);
                        setProjectData([analyticsData]); // Wrap in array for compatibility
                        setSelectedProject(analyticsData);
                    }
                } else {
                    // Fetch all user reports or fallback to mock data
                    try {
                        console.log('📊 Fetching all LCA reports...');
                        const response = await getUserLCAReports({ limit: 50 });
                        
                        if (response.success && response.data.reports.length > 0) {
                            const analyticsDataArray = response.data.reports.map(convertLCAToAnalytics);
                            console.log('✅ Loaded', analyticsDataArray.length, 'LCA reports');
                            setProjectData(analyticsDataArray);
                        } else {
                            // Fallback to mock data if no reports
                            console.log('⚠️ No LCA reports found, loading mock data');
                            const mockResponse = await fetch('/src/data/projectAnalytics.json');
                            const mockData = await mockResponse.json();
                            setProjectData(mockData);
                        }
                    } catch (apiError) {
                        console.error('⚠️ API error, falling back to mock data:', apiError);
                        const mockResponse = await fetch('/src/data/projectAnalytics.json');
                        const mockData = await mockResponse.json();
                        setProjectData(mockData);
                    }
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