import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, Lightbulb, TrendingUp } from 'lucide-react';

const SectionE = ({ insights = [] }) => {
  const recommendations = insights.filter(
    insight => insight.type === 'recommendation'
  ).slice(0, 3);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className="p-6 bg-[#efefe8]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#41531c]/10 rounded-lg">
          <Lightbulb className="w-5 h-5 text-[#41531c]" />
        </div>
        <h2 className="text-xl font-bold text-[#181814]">
          AI Recommendations & Insights
        </h2>
      </div>
      
      <div className="space-y-4">
        {recommendations.length > 0 ? (
          recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#41531c] hover:shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-[#181814] group-hover:text-[#41531c] transition-colors truncate">
                      {recommendation.title}
                    </h3>
                    {recommendation.priority && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority}
                      </span>
                    )}
                  </div>
                  
                  {recommendation.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {recommendation.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3">
                    {recommendation.confidenceScore && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {Math.round(recommendation.confidenceScore * 100)}% confidence
                        </span>
                      </div>
                    )}
                    
                    {recommendation.impact && (
                      <span className="text-xs text-gray-500">
                        Impact: {recommendation.impact}
                      </span>
                    )}
                  </div>
                </div>
                
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#41531c] transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No recommendations available</p>
            <p className="text-sm text-gray-400">
              AI insights will appear here as you use the platform
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SectionE;