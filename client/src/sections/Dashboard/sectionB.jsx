import React from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Wand2, Grid3x3, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SectionB = () => {
  const actions = [
    {
      icon: Plus,
      label: 'New Project',
      path: '/projects',
      color: 'bg-[#41531c]',
      hoverColor: 'hover:bg-[#354419]'
    },
    {
      icon: Wand2,
      label: 'Open Wizard',
      path: '/wizard',
      color: 'bg-[#949e32]',
      hoverColor: 'hover:bg-[#7a8429]'
    },
    {
      icon: Grid3x3,
      label: 'Go to Canvas',
      path: '/canvas',
      color: 'bg-[#949e32]',
      hoverColor: 'hover:bg-[#354419]'
    },
    {
      icon: BarChart3,
      label: 'Generate Report',
      path: '/reports',
      color: 'bg-[#41531c]',
      hoverColor: 'hover:bg-[#7a8429]'
    }
  ];

  return (
    <Card className="p-6 bg-[#efefe8]">
      <h2 className="text-xl font-bold text-[#181814] mb-6">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className={`${action.color} ${action.hoverColor} text-white rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
          >
            <action.icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-center">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default SectionB;