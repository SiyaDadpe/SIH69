import React, { useState, useMemo } from 'react';

export default function ProjectSelector({ onSelect, projects = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [hoveredProject, setHoveredProject] = useState(null);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isCompareMode, setIsCompareMode] = useState(false);

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

    return (
        <div className="project-selector w-full max-w-4xl mx-auto mb-6">
            <div className="flex gap-4 items-start">
                {/* Main Search/Select Area */}
                <div className="flex-1 relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search projects by name, ID, or location..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] shadow-sm"
                        />
                        <svg 
                            className="absolute right-3 top-3.5 w-5 h-5 text-gray-400"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                                {/* Filtered Projects */}
                                {filteredProjects.length > 0 ? (
                                    <div className="py-2">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                            {searchTerm ? 'Search Results' : 'All Projects'}
                                        </div>
                                        {filteredProjects.map((project) => (
                                            <div
                                                key={project.projectId}
                                                className={`px-4 py-3 hover:bg-[#BA7967]/5 cursor-pointer border-l-4 transition-colors ${
                                                    selectedProjects.find(p => p.projectId === project.projectId)
                                                        ? 'border-[#BA7967] bg-[#BA7967]/5'
                                                        : 'border-transparent'
                                                }`}
                                                onClick={() => handleProjectSelect(project)}
                                                onMouseEnter={() => setHoveredProject(project)}
                                                onMouseLeave={() => setHoveredProject(null)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {isCompareMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedProjects.find(p => p.projectId === project.projectId)}
                                                                    onChange={() => handleProjectSelect(project)}
                                                                    className="w-4 h-4 text-[#BA7967]"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            )}
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{project.projectName}</h4>
                                                                <p className="text-sm text-gray-600">
                                                                    {project.projectId} • {project.geographicAnalysis?.city}, {project.geographicAnalysis?.state}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Hover Preview */}
                                                        {hoveredProject?.projectId === project.projectId && (
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <div className="flex gap-4 text-sm">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-gray-600">Circularity:</span>
                                                                        <span className="font-semibold text-green-600">
                                                                            {getCircularityScore(project)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-gray-600">GWP Reduction:</span>
                                                                        <span className="font-semibold text-[#BA7967]">
                                                                            {getGWPReduction(project)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-gray-600">Cost Savings:</span>
                                                                        <span className="font-semibold text-gray-700">
                                                                            ${(project.comparativeMetrics?.totalCost?.savings || 0).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-500">
                                        No projects found matching "{searchTerm}"
                                    </div>
                                )}

                                {/* Recent Projects */}
                                {!searchTerm && recentProjects.length > 0 && (
                                    <div className="border-t border-gray-200 py-2">
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                            Recent Projects
                                        </div>
                                        {recentProjects.map((project) => (
                                            <div
                                                key={project.projectId}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                                onClick={() => handleProjectSelect(project)}
                                            >
                                                <div>
                                                    <h5 className="text-sm font-medium text-gray-900">{project.projectName}</h5>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(project.analysisDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 text-xs">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                                        {getCircularityScore(project)}%
                                                    </span>
                                                    <span className="px-2 py-1 bg-[#BA7967]/10 text-[#BA7967] rounded">
                                                        -{getGWPReduction(project)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Compare Button */}
                <button
                    onClick={toggleCompareMode}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        isCompareMode
                            ? 'bg-[#BA7967] text-white hover:bg-[#a86b5c]'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {isCompareMode ? 'Cancel Compare' : 'Compare'}
                </button>
            </div>

            {/* Compare Mode Footer */}
            {isCompareMode && (
                <div className="mt-4 p-4 bg-[#BA7967]/5 border border-[#BA7967]/20 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            <span className="font-semibold">{selectedProjects.length}</span> project(s) selected for comparison
                            {selectedProjects.length > 0 && (
                                <span className="ml-2 text-gray-600">
                                    ({selectedProjects.map(p => p.projectId).join(', ')})
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleCompare}
                            disabled={selectedProjects.length < 2}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedProjects.length >= 2
                                    ? 'bg-[#BA7967] text-white hover:bg-[#a86b5c]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Compare {selectedProjects.length} Projects
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
