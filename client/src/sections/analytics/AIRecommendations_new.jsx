import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AIRecommendations({ mode, selectedProject }) {
    const [selectedPriority, setSelectedPriority] = useState('all');

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view AI recommendations
            </div>
        );
    }

    // Get actual recommendations from backend
    const recommendations = selectedProject.aiRecommendations || [];

    // Filter by priority
    const filteredRecommendations = selectedPriority === 'all' 
        ? recommendations 
        : recommendations.filter(rec => rec.priority.toLowerCase() === selectedPriority);

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            high: '#F59E0B',
            medium: '#3B82F6',
            low: '#6B7280'
        };
        return colors[priority.toLowerCase()] || colors.medium;
    };

    // Get priority icon
    const getPriorityIcon = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return <AlertCircle className="w-5 h-5" />;
            case 'medium':
                return <AlertTriangle className="w-5 h-5" />;
            case 'low':
                return <CheckCircle2 className="w-5 h-5" />;
            default:
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    // Count by priority
    const priorityCounts = {
        high: recommendations.filter(r => r.priority.toLowerCase() === 'high').length,
        medium: recommendations.filter(r => r.priority.toLowerCase() === 'medium').length,
        low: recommendations.filter(r => r.priority.toLowerCase() === 'low').length
    };

    return (
        <div className="ai-recommendations space-y-6">
            {/* Header */}
            <div className="bg-linear-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Recommendations</h2>
                        <p className="text-gray-600">
                            {mode === 'circular' ? 'Circular economy optimization insights' : 'Linear process improvement opportunities'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#BA7967]">
                            {recommendations.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Recommendations</div>
                    </div>
                </div>
            </div>

            {/* Priority Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Filter by Priority</h3>
                        <p className="text-xs text-gray-600">View recommendations by priority level</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedPriority('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'all'
                                    ? 'bg-[#BA7967] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All ({recommendations.length})
                        </button>
                        <button
                            onClick={() => setSelectedPriority('high')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'high'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            High ({priorityCounts.high})
                        </button>
                        <button
                            onClick={() => setSelectedPriority('medium')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'medium'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Medium ({priorityCounts.medium})
                        </button>
                        <button
                            onClick={() => setSelectedPriority('low')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPriority === 'low'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Low ({priorityCounts.low})
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommendations List */}
            {filteredRecommendations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations Found</h3>
                    <p className="text-gray-600">
                        {selectedPriority === 'all' 
                            ? 'No recommendations available for this workflow.'
                            : `No ${selectedPriority} priority recommendations found. Try a different filter.`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRecommendations.map((recommendation, index) => (
                        <div 
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {/* Priority Badge */}
                                <div 
                                    className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0"
                                    style={{ 
                                        backgroundColor: `${getPriorityColor(recommendation.priority)}20`,
                                        color: getPriorityColor(recommendation.priority)
                                    }}
                                >
                                    {getPriorityIcon(recommendation.priority)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {recommendation.title}
                                        </h3>
                                        <span 
                                            className="px-3 py-1 rounded-full text-xs font-medium uppercase shrink-0"
                                            style={{
                                                backgroundColor: `${getPriorityColor(recommendation.priority)}20`,
                                                color: getPriorityColor(recommendation.priority)
                                            }}
                                        >
                                            {recommendation.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        {recommendation.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
