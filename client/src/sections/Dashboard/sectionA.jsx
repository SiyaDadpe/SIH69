import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SectionA = ({ user, summary }) => {
  const formatDate = () => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <Card className="p-6 md:p-8 lg:p-10 bg-[#efefe8]">
      <div className="space-y-20">
        {/* Header Section */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#181814] mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Today is {formatDate()}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {/* Active Projects */}
          <div className="bg-white/50 rounded-lg p-4 md:p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-3 md:mb-4">Active Projects</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#181814]">
                {summary?.totalProjects || 0}
              </p>
              {summary?.trendingScore !== undefined && (
                <div className={`flex items-center gap-1 ${getTrendColor(summary.trendingScore)}`}>
                  {getTrendIcon(summary.trendingScore)}
                  <span className="text-sm font-medium">
                    {Math.abs(summary.trendingScore)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white/50 rounded-lg p-4 md:p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-3 md:mb-4">Generated Reports</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#181814]">
                {summary?.completedAssessments || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SectionA;