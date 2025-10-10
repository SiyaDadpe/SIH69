// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import SectionA from '../sections/Dashboard/sectionA';
import SectionB from '../sections/Dashboard/sectionB';
import SectionC from '../sections/Dashboard/sectionC';
import SectionD from '../sections/Dashboard/sectionD';
import SectionE from '../sections/Dashboard/sectionE';
import SectionF from '../sections/Dashboard/sectionF';


// Import mock data
import users from "../data/users.json"
import projects from '../data/projects.json';
import insights from '../data/insights.json';
import benchmarks from '../data/benchmarks.json';
import dashboardSummaries from '../data/dashboardSummaries.json';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    user: null,
    summary: null,
    projects: [],
    insights: [],
    benchmarks: null
  });

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

  if (!dashboardData.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#efefe8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#41531c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-[#efefe8] p-6">
    <div className="w-full space-y-6">  {/* 🔥 Changed this line */}
      {/* Row 1: Welcome and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionA 
            user={dashboardData.user} 
            summary={dashboardData.summary} 
          />
        </div>
        <div>
           <SectionB /> 
        </div>
      </div>

      {/* Row 2: Recent Projects */}
      <div>
        <SectionC projects={dashboardData.projects} />
      </div>

      {/* Row 3: KPIs */}
      <div>
        <SectionD summary={dashboardData.summary} />
      </div>

      {/* Row 4: AI Recommendations and Industry Benchmarking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionE insights={dashboardData.insights} />
        <SectionF 
          benchmarks={dashboardData.benchmarks} 
          summary={dashboardData.summary}
        />
      </div>
    </div>
  </div>
);
};

export default Dashboard;