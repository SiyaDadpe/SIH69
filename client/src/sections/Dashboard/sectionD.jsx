import React from 'react';
import { Card } from '@/components/ui/card';
import { FolderOpen, Recycle, Leaf, TrendingUp, TrendingDown } from 'lucide-react';

const SectionD = ({ summary }) => {
  const kpis = [
    {
      icon: FolderOpen,
      label: 'Total Projects',
      value: summary?.totalProjects || 0,
      trend: summary?.projectsThisMonth || 0,
      trendLabel: 'vs last month',
      color: 'bg-[#41531c]/10',
      iconColor: 'text-[#41531c]'
    },
    {
      icon: Recycle,
      label: 'Average Circularity',
      value: `${summary?.averageCircularityScore || 0}%`,
      trend: summary?.trendingScore || 0,
      trendLabel: 'vs last month',
      color: 'bg-[#949e32]/10',
      iconColor: 'text-[#949e32]'
    },
    {
      icon: Leaf,
      label: 'Total CO₂ Saved',
      value: `${(summary?.totalCO2Saved || 0).toLocaleString()} kg`,
      trend: 20,
      trendLabel: 'vs last month',
      color: 'bg-[#41531c]/10',
      iconColor: 'text-[#41531c]'
    }
  ];

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="p-6 bg-[#efefe8] hover:bg-white/50 transition-colors duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${kpi.color}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium">
              {kpi.label}
            </p>
            <p className="text-3xl font-bold text-[#181814]">
              {kpi.value}
            </p>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                {getTrendIcon(kpi.trend)}
                <span className="text-sm font-semibold">
                  {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {kpi.trendLabel}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SectionD;