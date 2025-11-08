import React, { useState, useEffect } from 'react';
import ProjectSelector from '../sections/analytics/ProjectSelector';
import Header from '../sections/analytics/Header';
import TabbedDashboard from '../sections/analytics/TabbedDashboard';

export default function Analytics() {
    const [projectData, setProjectData] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [mode, setMode] = useState('circular');
    const [activeTab, setActiveTab] = useState(1);

    useEffect(() => {
        // Fetch project analytics data
        const fetchProjectData = async () => {
            try {
                const response = await fetch('/src/data/projectAnalytics.json');
                const data = await response.json();
                console.log('Project Analytics Data:', data);
                setProjectData(data);
            } catch (error) {
                console.error('Error loading project analytics data:', error);
            }
        };

        fetchProjectData();
    }, []);

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
            {!projectData ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BA7967] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading analytics data...</p>
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