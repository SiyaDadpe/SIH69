import React, { useState, useMemo } from 'react';
import { getUserLCAReports } from '../../services/lcaService';

export default function ProjectSelector({ onSelect, projects = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [hoveredProject, setHoveredProject] = useState(null);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [loadingLatest, setLoadingLatest] = useState(false);

    // Filter projects based on search term
    const filteredProjects = useMemo(() => {
        if (!searchTerm.trim()) return projects;
        const search = searchTerm.toLowerCase();
        return projects.filter(project => 
            project.projectName.toLowerCase().includes(search) ||
            project.projectId.toLowerCase().includes(search) ||
            (project.geographicAnalysis?.city?.toLowerCase().includes(search))
        );
    }, [searchTerm, projects]);

    // Get recent projects (last 3)
    const recentProjects = useMemo(() => {
        return projects
            .slice()
            .sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate))
            .slice(0, 3);
    }, [projects]);

    // Calculate circularity score
    const getCircularityScore = (project) => {
        return project.circularModel?.materialCircularity || 0;
    };

    // Calculate GWP (Global Warming Potential) reduction
    const getGWPReduction = (project) => {
        const linear = project.linearModel?.totalEmissions || 0;
        const circular = project.circularModel?.totalEmissions || 0;
        return linear > 0 ? Math.round(((linear - circular) / linear) * 100) : 0;
    };

    const handleProjectSelect = (project) => {
        if (isCompareMode) {
            if (selectedProjects.find(p => p.projectId === project.projectId)) {
                setSelectedProjects(selectedProjects.filter(p => p.projectId !== project.projectId));
            } else if (selectedProjects.length < 3) {
                setSelectedProjects([...selectedProjects, project]);
            }
        } else {
            onSelect(project);
            setIsDropdownOpen(false);
            setSearchTerm('');
        }
    };

    const handleCompare = () => {
        if (selectedProjects.length >= 2) {
            onSelect({ compareMode: true, projects: selectedProjects });
            setIsCompareMode(false);
            setSelectedProjects([]);
            setIsDropdownOpen(false);
        }
    };

    const toggleCompareMode = () => {
        setIsCompareMode(!isCompareMode);
        setSelectedProjects([]);
    };

    const handleViewLatestReport = async () => {
        setLoadingLatest(true);
        try {
            const response = await getUserLCAReports({ limit: 1, page: 1 });
            if (response.success && response.data.reports.length > 0) {
                const latestReport = response.data.reports[0];
                // Navigate to analytics with reportId
                window.location.href = `/analytics?reportId=${latestReport._id}`;
            } else {
                alert('No LCA reports found. Complete a wizard workflow to generate a report.');
            }
        } catch (error) {
            console.error('Failed to fetch latest report:', error);
            alert('Failed to load latest report: ' + error.message);
        } finally {
            setLoadingLatest(false);
        }
    };

    return (
        <div className="project-selector w-full max-w-4xl mx-auto mb-6">
            {/* REMOVED: Search bar, View Latest Report button, and Compare button per user request */}
        </div>
    );
}
