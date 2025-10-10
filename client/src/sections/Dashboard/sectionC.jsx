import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Eye, Trash2, ArrowUpDown, MoreHorizontal } from 'lucide-react';

const SectionC = ({ projects = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = React.useMemo(() => {
    let sortableProjects = [...projects];
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
  }, [projects, sortConfig]);

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

  return (
    <Card className="p-6 bg-[#efefe8]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#181814]">Recent Projects</h2>
        <Button 
          variant="link" 
          className="text-[#41531c] hover:text-[#354419] font-medium p-0 h-auto"
          onClick={() => window.location.href = '/projects'}
        >
          View All Projects
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-[#41531c] transition-colors"
                >
                  Project Name
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('metalType')}
                  className="flex items-center gap-1 hover:text-[#41531c] transition-colors"
                >
                  Metal & Process
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('lastModified')}
                  className="flex items-center gap-1 hover:text-[#41531c] transition-colors"
                >
                  Last Modified
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('circularityScore')}
                  className="flex items-center gap-1 hover:text-[#41531c] transition-colors"
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
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#41531c]"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(project.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-[#41531c]"
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
              className="border-[#41531c] text-[#41531c] hover:bg-[#41531c] hover:text-white"
            >
              Create First Project
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SectionC;