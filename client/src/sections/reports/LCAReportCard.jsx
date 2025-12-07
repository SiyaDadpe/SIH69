import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Eye,
  Factory,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusStyles = {
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-200 text-slate-700 border-slate-300',
  },
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const getCircularityRating = (score) => {
  if (!score && score !== 0) return 'N/A';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

const getCircularityColor = (score) => {
  if (!score && score !== 0) return 'text-slate-600';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
};

const LCAReportCard = ({ report, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const status = report.status || 'draft';
  const statusStyle = statusStyles[status] || statusStyles.draft;

  const handleViewAnalytics = () => {
    const reportId = report._id || report.workflowId;
    if (reportId) {
      navigate(`/analytics?reportId=${reportId}`);
    }
  };

  const circularityScore = report.circularityScore ?? report.metadata?.circularityScore;
  const circularityRating = report.circularityRating || getCircularityRating(circularityScore);

  return (
    <Card
      className={cn(
        'border-[#E6E1D7] bg-white shadow-sm transition-all hover:shadow-md',
        viewMode === 'list' && 'flex flex-row items-center'
      )}
    >
      <CardContent className={cn('p-4', viewMode === 'list' && 'flex flex-1 items-center gap-4')}>
        {viewMode === 'grid' ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs font-medium', statusStyle.className)}
                >
                  {statusStyle.label}
                </Badge>
                {circularityScore !== null && circularityScore !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      getCircularityColor(circularityScore),
                      'border-current'
                    )}
                  >
                    {circularityRating}
                  </Badge>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-[#181814] line-clamp-2">
                {report.projectName || report.metadata?.projectName || 'Untitled LCA Report'}
              </h3>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-[#6b5b59]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#BA7967]" />
                <span>{formatDate(report.analysisDate || report.createdAt)}</span>
              </div>

              {report.metalType && (
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-[#BA7967]" />
                  <span className="capitalize">{report.metalType}</span>
                </div>
              )}

              {report.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#BA7967]" />
                  <span>{report.location}</span>
                </div>
              )}

              {circularityScore !== null && circularityScore !== undefined && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#BA7967]" />
                  <span>Circularity Score: <strong>{circularityScore.toFixed(1)}%</strong></span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-[#BA7967] text-white hover:bg-[#3d3635]"
                onClick={handleViewAnalytics}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </div>
        ) : (
          // List view
          <>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  className={cn('text-xs font-medium', statusStyle.className)}
                >
                  {statusStyle.label}
                </Badge>
                {circularityScore !== null && circularityScore !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-medium',
                      getCircularityColor(circularityScore),
                      'border-current'
                    )}
                  >
                    {circularityRating}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-[#181814] mb-1">
                {report.projectName || report.metadata?.projectName || 'Untitled LCA Report'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-[#6b5b59]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(report.analysisDate || report.createdAt)}
                </span>
                {report.metalType && (
                  <span className="flex items-center gap-1">
                    <Factory className="h-3 w-3" />
                    {report.metalType}
                  </span>
                )}
                {report.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {report.location}
                  </span>
                )}
                {circularityScore !== null && circularityScore !== undefined && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Score: {circularityScore.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <Button
              className="bg-[#BA7967] text-white hover:bg-[#3d3635]"
              onClick={handleViewAnalytics}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LCAReportCard;
