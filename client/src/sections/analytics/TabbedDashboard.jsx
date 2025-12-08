import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExecutiveSummary from './ExecutiveSummary';
import ProcessStages from './ProcessStages';
import GeographicAnalysis from './GeographicAnalysis';
import AIRecommendations from './AIRecommendations_new';
import DetailedReports from './DetailedReports';
import LinearCircularSummary from './LinearCircularSummary';
import SankeyDiagramTab from './SankeyDiagramTab';

export default function TabbedDashboard({ activeTab = 1, onTabChange, mode = 'circular', selectedProject }) {
    
    const tabs = [
        {
            id: 1,
            name: 'Executive Summary',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            component: ExecutiveSummary
        },
        {
            id: 2,
            name: 'Process Stage Analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            component: ProcessStages
        },
        {
            id: 3,
            name: 'Sankey Diagram',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            ),
            component: SankeyDiagramTab
        },
        {
            id: 4,
            name: 'Linear vs Circular',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M9 6l-6 6 6 6m6-12l6 6-6 6" />
                </svg>
            ),
            component: LinearCircularSummary
        },
        {
            id: 5,
            name: 'Geographic Analysis',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            component: GeographicAnalysis
        },
        {
            id: 6,
            name: 'AI Recommendations',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            component: AIRecommendations
        },
        {
            id: 7,
            name: 'Detailed Reports',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            component: DetailedReports
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ExecutiveSummary;

    return (
        <div className="tabbed-dashboard">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6">
                    <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                    transition-colors duration-200
                                    ${activeTab === tab.id
                                        ? 'border-[#BA7967] text-[#BA7967]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <span className={`
                                    transition-colors duration-200
                                    ${activeTab === tab.id ? 'text-[#BA7967]' : 'text-gray-400 group-hover:text-gray-600'}
                                `}>
                                    {tab.icon}
                                </span>
                                {tab.name}
                                {activeTab === tab.id && (
                                    <span className="ml-2 bg-[#BA7967]/10 text-[#BA7967] py-0.5 px-2 rounded-full text-xs font-semibold">
                                        Active
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="px-6 py-6">
                {/* Mode Indicator */}
                <AnimatePresence mode="wait">
                    {selectedProject && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 flex items-center gap-3"
                        >
                            <span className="text-sm text-gray-600">Viewing in:</span>
                            <span className={`
                                inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                                ${mode === 'linear' 
                                    ? 'bg-red-100 text-red-700' 
                                    : mode === 'circular'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-[#BA7967]/10 text-[#BA7967]'
                                }
                            `}>
                                <div className={`w-2 h-2 rounded-full ${
                                    mode === 'linear' 
                                        ? 'bg-red-500' 
                                        : mode === 'circular'
                                        ? 'bg-green-500'
                                        : 'bg-[#BA7967]'
                                }`}></div>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active Tab Component */}
                <div className="tab-content">
                    <AnimatePresence mode="wait">
                        {selectedProject ? (
                            <motion.div
                                key={`project-${selectedProject.projectId}-${activeTab}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                                <ActiveComponent 
                                    mode={mode}
                                    selectedProject={selectedProject}
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="no-project"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-12"
                            >
                                <div className="text-center">
                                    <motion.svg 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                                        className="w-16 h-16 text-gray-400 mx-auto mb-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </motion.svg>
                                    <motion.h3 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-lg font-medium text-gray-900 mb-2"
                                    >
                                        No Project Selected
                                    </motion.h3>
                                    <motion.p 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-gray-500 mb-6"
                                    >
                                        Please select a project from the dropdown above to view detailed analytics
                                    </motion.p>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="inline-flex items-center gap-2 text-sm text-[#BA7967]"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        Use the Project Selector to get started
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tab Quick Info */}
                <AnimatePresence mode="wait">
                    {selectedProject && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mt-6 bg-[#BA7967]/5 border border-[#BA7967]/20 rounded-lg p-4"
                        >
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-[#BA7967] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                        {tabs.find(tab => tab.id === activeTab)?.name}
                                    </h4>
                                    <p className="text-sm text-gray-700">
                                        {activeTab === 1 && "Overview of key performance indicators and comparative analysis"}
                                        {activeTab === 2 && "Detailed breakdown of production stages with efficiency metrics"}
                                        {activeTab === 3 && "Side-by-side summary of linear vs circular performance"}
                                        {activeTab === 4 && "Geographic distribution, facilities, and supply chain visualization"}
                                        {activeTab === 5 && "AI-powered recommendations for optimization and improvement"}
                                        {activeTab === 6 && "Comprehensive reports with exportable data and insights"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
