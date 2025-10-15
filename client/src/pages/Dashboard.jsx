// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Wand2, 
  Grid3x3, 
  BarChart3,
  Edit, 
  Eye, 
  Trash2, 
  ArrowUpDown, 
  MoreHorizontal,
  FolderOpen, 
  Recycle, 
  Leaf,
  ChevronDown, 
  Lightbulb,
  CheckCircle2,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

// Import mock data
import users from "../data/users.json"
import projects from '../data/projects.json';
import insights from '../data/insights.json';
import benchmarks from '../data/benchmarks.json';
import dashboardSummaries from '../data/dashboardSummaries.json';

const Dashboard = () => {
  const { sidebarOpen } = useSidebar()
  const [dashboardData, setDashboardData] = useState({
    user: null,
    summary: null,
    projects: [],
    insights: [],
    benchmarks: null
  });

  // State for sorting projects
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // State for benchmark animations
  const [animatedUserScore, setAnimatedUserScore] = useState(0);
  const [animatedIndustryScore, setAnimatedIndustryScore] = useState(0);

  useEffect(() => {
    // Simulate loading data
    // In a real app, you'd fetch this from an API
    const currentUser = users[0]; // Using first user as logged-in user
    const currentSummary = dashboardSummaries[0]; // Using first summary

    setDashboardData({
      user: currentUser,
      summary: currentSummary,
      projects: projects,
      insights: insights,
      benchmarks: benchmarks
    });
  }, []);

  // Animate benchmark scores
  useEffect(() => {
    if (dashboardData.summary && dashboardData.benchmarks) {
      const userScore = dashboardData.summary?.averageCircularityScore || dashboardData.benchmarks?.userAverageCircularity || 0;
      const industryScore = dashboardData.benchmarks?.industryMedianCircularity || 0;
      
      const duration = 1200;
      const steps = 60;
      const userIncrement = userScore / steps;
      const industryIncrement = industryScore / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setAnimatedUserScore(Math.min(userIncrement * currentStep, userScore));
          setAnimatedIndustryScore(Math.min(industryIncrement * currentStep, industryScore));
        } else {
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [dashboardData.summary, dashboardData.benchmarks]);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) {
      const options = { month: 'long', day: 'numeric', year: 'numeric' };
      return new Date().toLocaleDateString('en-US', options);
    }
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = React.useMemo(() => {
    let sortableProjects = [...dashboardData.projects];
    if (sortConfig.key) {
      sortableProjects.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableProjects;
  }, [dashboardData.projects, sortConfig]);

  const handleEdit = (projectId) => {
    window.location.href = `/projects/${projectId}/edit`;
  };

  const handleView = (projectId) => {
    window.location.href = `/projects/${projectId}`;
  };

  const handleDelete = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      console.log('Delete project:', projectId);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const getPerformanceMessage = () => {
    const userScore = dashboardData.summary?.averageCircularityScore || dashboardData.benchmarks?.userAverageCircularity || 0;
    const industryScore = dashboardData.benchmarks?.industryMedianCircularity || 0;
    const isOutperforming = userScore > industryScore;
    const scoreDifference = parseFloat(Math.abs(userScore - industryScore).toFixed(2));

    if (isOutperforming) {
      if (scoreDifference > 20) return "Exceptional performance!";
      if (scoreDifference > 10) return "Great work!";
      return "Doing well!";
    }
    if (scoreDifference > 20) return "Needs improvement";
    if (scoreDifference > 10) return "Close to industry average";
    return "Almost there!";
  };

  if (!dashboardData.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFFFF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BA7967] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Quick Actions data
  const actions = [
    {
      icon: Plus,
      label: 'New Project',
      path: '/projects',
      color: 'bg-[#BA7967]',
      hoverColor: 'hover:bg-[#3d3635]'
    },
    {
      icon: Wand2,
      label: 'Open Wizard',
      path: '/wizard',
      color: 'bg-[#6b5b59]',
      hoverColor: 'hover:bg-[#3d3635]'
    },
    {
      icon: Grid3x3,
      label: 'Go to Canvas',
      path: '/canvas',
      color: 'bg-[#6b5b59]',
      hoverColor: 'hover:bg-[#3d3635]'
    },
    {
      icon: BarChart3,
      label: 'Generate Report',
      path: '/reports',
      color: 'bg-[#BA7967]',
      hoverColor: 'hover:bg-[#3d3635]'
    }
  ];

  // KPIs data
  const kpis = [
    {
      icon: FolderOpen,
      label: 'Total Projects',
      value: dashboardData.summary?.totalProjects || 0,
      trend: dashboardData.summary?.projectsThisMonth || 0,
      trendLabel: 'vs last month',
      color: 'bg-[#BA7967]/10',
      iconColor: 'text-[#BA7967]'
    },
    {
      icon: Recycle,
      label: 'Average Circularity',
      value: `${dashboardData.summary?.averageCircularityScore || 0}%`,
      trend: dashboardData.summary?.trendingScore || 0,
      trendLabel: 'vs last month',
      color: 'bg-[#6b5b59]/10',
      iconColor: 'text-[#6b5b59]'
    },
    {
      icon: Leaf,
      label: 'Total CO₂ Saved',
      value: `${(dashboardData.summary?.totalCO2Saved || 0).toLocaleString()} kg`,
      trend: 20,
      trendLabel: 'vs last month',
      color: 'bg-[#BA7967]/10',
      iconColor: 'text-[#BA7967]'
    }
  ];

  // AI Recommendations
  const recommendations = dashboardData.insights.filter(
    insight => insight.type === 'recommendation'
  ).slice(0, 3);

  // Benchmark data
  const userScore = dashboardData.summary?.averageCircularityScore || dashboardData.benchmarks?.userAverageCircularity || 0;
  const industryScore = dashboardData.benchmarks?.industryMedianCircularity || 0;
  const percentile = dashboardData.benchmarks?.userPercentile || 0;
  const isOutperforming = userScore > industryScore;
  const scoreDifference = parseFloat(Math.abs(userScore - industryScore).toFixed(2));

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-2 sm:p-6">
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Row 1: Welcome and Quick Actions */}
        <div className={`grid gap-4 sm:gap-6 ${sidebarOpen ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 xl:grid-cols-3'}`}>
          {/* Section A - Welcome */}
          <div className={sidebarOpen ? 'lg:col-span-2' : 'xl:col-span-2'}>
            <Card className="p-4 sm:p-6 md:p-8 lg:p-10 bg-[#F3F2EC]">
              <div className="space-y-10 sm:space-y-20">
                {/* Header Section */}
                <div className="text-center md:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#181814] mb-2">
                    Welcome back, {dashboardData.user?.name?.split(' ')[0] || 'User'}
                  </h1>
                  <p className="text-sm md:text-base text-gray-600">
                    Today is {formatDate()}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
                  {/* Active Projects */}
                  <div className="bg-white/50 rounded-lg p-4 md:p-6 shadow-sm">
                    <p className="text-sm text-gray-600 mb-3 md:mb-4">Active Projects</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#181814]">
                        {dashboardData.summary?.totalProjects || 0}
                      </p>
                      {dashboardData.summary?.trendingScore !== undefined && (
                        <div className={`flex items-center gap-1 ${getTrendColor(dashboardData.summary.trendingScore)}`}>
                          {getTrendIcon(dashboardData.summary.trendingScore)}
                          <span className="text-sm font-medium">
                            {Math.abs(dashboardData.summary.trendingScore)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generated Reports */}
                  <div className="bg-white/50 rounded-lg p-4 md:p-6 shadow-sm">
                    <p className="text-sm text-gray-600 mb-3 md:mb-4">Generated Reports</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#181814]">
                        {dashboardData.summary?.completedAssessments || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Section B - Quick Actions */}
          <div>
            <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
              <h2 className="text-lg sm:text-xl font-bold text-[#181814] mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {actions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className={`${action.color} ${action.hoverColor} text-white rounded-lg p-3 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
                  >
                    <action.icon className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-semibold text-center">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Row 2: Recent Projects - Section C */}
        <div>
          <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#181814]">Recent Projects</h2>
              <Button 
                variant="link" 
                className="text-[#BA7967] hover:text-[#3d3635] font-medium p-0 h-auto self-start sm:self-auto"
                onClick={() => window.location.href = '/projects'}
              >
                View All Projects
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button 
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 hover:text-[#BA7967] transition-colors"
                      >
                        Project Name
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button 
                        onClick={() => handleSort('metalType')}
                        className="flex items-center gap-1 hover:text-[#BA7967] transition-colors"
                      >
                        Metal & Process
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button 
                        onClick={() => handleSort('lastModified')}
                        className="flex items-center gap-1 hover:text-[#BA7967] transition-colors"
                      >
                        Last Modified
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <button 
                        onClick={() => handleSort('circularityScore')}
                        className="flex items-center gap-1 hover:text-[#BA7967] transition-colors"
                      >
                        Circularity Score
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProjects.slice(0, 5).map((project) => (
                    <tr 
                      key={project.id} 
                      className="border-b border-gray-200 hover:bg-white/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-[#181814]">
                        {project.name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {project.metalType} - {project.processType}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(project.lastModified)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-[#181814] min-w-[2rem]">
                            {project.circularityScore}%
                          </span>
                          <Progress 
                            value={project.circularityScore} 
                            className="h-2 flex-1 bg-gray-300"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleView(project.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#BA7967]"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(project.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#BA7967]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sortedProjects.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No projects found</div>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/projects/new'}
                    className="border-[#BA7967] text-[#BA7967] hover:bg-[#BA7967] hover:text-white"
                  >
                    Create First Project
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Row 3: KPIs - Section D */}
        <div>
          <div className={`grid gap-4 sm:gap-6 ${sidebarOpen ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {kpis.map((kpi, index) => (
              <Card key={index} className="p-4 sm:p-6 bg-[#F3F2EC] hover:bg-white/50 transition-colors duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${kpi.color}`}>
                    <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">
                    {kpi.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#181814]">
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
        </div>

        {/* Row 4: AI Recommendations and Industry Benchmarking */}
        <div className={`grid gap-4 sm:gap-6 ${sidebarOpen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 xl:grid-cols-2'}`}>
          {/* Section E - AI Recommendations */}
          <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-[#BA7967]/10 rounded-lg">
                <Lightbulb className="w-5 h-5 text-[#BA7967]" />
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
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#BA7967] hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-[#181814] group-hover:text-[#BA7967] transition-colors truncate">
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
                      
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#BA7967] transition-colors flex-shrink-0 mt-1" />
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

          {/* Section F - Industry Benchmarking */}
          <Card className="p-4 sm:p-6 bg-[#F3F2EC]">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 bg-[#BA7967]/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-[#BA7967]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#181814]">
                Industry Benchmarking
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Performance Summary */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className={`w-5 h-5 ${isOutperforming ? 'text-green-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-semibold ${isOutperforming ? 'text-green-700' : 'text-amber-700'}`}>
                    {getPerformanceMessage()}
                  </span>
                </div>
                {percentile > 0 && (
                  <p className="text-xs text-gray-600">
                    You're in the top <span className="font-semibold">{100 - percentile}%</span> of companies
                  </p>
                )}
              </div>

              {/* User Score */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#BA7967]"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Your Average
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#BA7967]" />
                    <span className="text-lg font-bold text-[#181814]">
                      {Math.round(animatedUserScore)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={animatedUserScore} 
                  className="h-3 bg-gray-200"
                  style={{ 
                    '--progress-background': '#BA7967'
                  }}
                />
              </div>

              {/* Industry Score */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Industry Median
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">
                    {Math.round(animatedIndustryScore)}%
                  </span>
                </div>
                <Progress 
                  value={animatedIndustryScore} 
                  className="h-3 bg-gray-200"
                  style={{ 
                    '--progress-background': '#6b7280'
                  }}
                />
              </div>

              {/* Performance Insight */}
              {isOutperforming ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">
                        Industry Leader
                      </p>
                      <p className="text-xs text-green-700">
                        You're performing {scoreDifference}% better than the industry average. 
                        {percentile > 75 && " Keep up the excellent work!"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : userScore < industryScore ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Growth Opportunity
                      </p>
                      <p className="text-xs text-amber-700">
                        You're {scoreDifference}% below industry average. Focus on improving circularity practices.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <Button 
                onClick={() => window.location.href = '/report'}
                className="w-full bg-[#BA7967] hover:bg-[#3d3635] text-white font-semibold py-3 transition-colors"
              >
                View Detailed Benchmark Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;