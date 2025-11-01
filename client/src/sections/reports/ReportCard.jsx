import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Archive,
  Bolt,
  Calendar,
  Clock3,
  Copy,
  Droplet,
  Eye,
  Factory,
  FileDown,
  FileSpreadsheet,
  Gauge,
  GitCompare,
  Globe2,
  Layers,
  MoreHorizontal,
  Pencil,
  Package,
  Share2,
  Trash2,
  UserRound,
} from 'lucide-react';

const statusStyles = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  final: {
    label: 'Final',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  published: {
    label: 'Published',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-slate-200 text-slate-700 border-slate-300',
  },
};

const KNOWN_METALS = ['aluminum', 'aluminium', 'steel', 'copper', 'mixed', 'residuals', 'iron', 'nickel'];

const toTitleCase = (value) =>
  value
    ? value
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Not specified';

const deriveMetalInfo = (tags = []) => {
  for (const tag of tags) {
    if (KNOWN_METALS.includes(tag.toLowerCase())) {
      return { label: toTitleCase(tag), raw: tag };
    }
  }
  return { label: 'Not specified', raw: null };
};

const deriveProcessLabel = (tags = [], metalTag) => {
  const candidate = tags.find((tag) => tag !== metalTag);
  return candidate ? toTitleCase(candidate) : 'Not specified';
};

const formatNumber = (value, maximumFractionDigits = 1) => {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-IN', { maximumFractionDigits });
  }
  return value;
};

const appendSuffix = (value, suffix) => (value === '—' ? value : `${value}${suffix}`);

const formatDate = (input) => {
  if (!input) {
    return '—';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatAuthor = (value) => {
  if (!value) {
    return 'Unknown';
  }
  if (value.toLowerCase() === 'system') {
    return 'System';
  }
  if (value.startsWith('u-')) {
    return `User ${value.split('-')[1]}`;
  }
  return toTitleCase(value);
};

const DEFAULT_POLICY = {
  canEdit: true,
  canDuplicate: true,
  canShare: true,
  canArchive: true,
  canDelete: true,
  canExport: true,
  canCompare: true,
};

const ReportCard = ({ 
  report, 
  selected, 
  onToggleSelect, 
  onExport, 
  viewMode = 'grid', 
  statusPolicies = {},
  onEdit,
  onDuplicate,
  onShare,
  onArchive,
  onDelete,
  onRefresh
}) => {
  const statusKey = report.status?.toLowerCase();
  const statusConfig = statusStyles[statusKey] || {
    label: toTitleCase(report.status || report.category || 'Pending'),
    className: 'bg-[#F3F2EC] text-[#3d3635] border-[#E6E1D7]',
  };

  const resolvedPolicy = useMemo(() => {
    const basePolicy = { ...DEFAULT_POLICY, ...(statusPolicies.default || {}) };
    if (statusKey && statusPolicies[statusKey]) {
      return { ...basePolicy, ...statusPolicies[statusKey] };
    }
    return basePolicy;
  }, [statusKey, statusPolicies]);

  const metalInfo = useMemo(() => deriveMetalInfo(report.tags), [report.tags]);
  const processLabel = useMemo(
    () => deriveProcessLabel(report.tags, metalInfo.raw),
    [report.tags, metalInfo.raw]
  );

  const metrics = useMemo(
    () => [
      {
        key: 'circularityScore',
        label: 'Circularity',
        value: appendSuffix(formatNumber(report.summary?.circularityScore, 1), '%'),
        icon: Gauge,
      },
      {
        key: 'gwp',
        label: 'GWP',
        value: appendSuffix(formatNumber(report.summary?.gwp, 2), ' tCO₂e'),
        icon: Globe2,
      },
      {
        key: 'energyDemand',
        label: 'Energy',
        value: appendSuffix(formatNumber(report.summary?.energyDemand, 0), ' kWh/t'),
        icon: Bolt,
      },
      {
        key: 'waterConsumption',
        label: 'Water',
        value: appendSuffix(formatNumber(report.summary?.waterConsumption, 0), ' m³'),
        icon: Droplet,
      },
    ],
    [report.summary]
  );

  const safeAlert = (message) => {
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
  };

  const safeConfirm = (message) => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.confirm(message);
  };

  const ensurePermission = (permissionKey, fallbackMessage) => {
    if (!permissionKey) {
      return true;
    }
    if (!resolvedPolicy[permissionKey]) {
      safeAlert(fallbackMessage || `${statusConfig.label} reports cannot perform this action yet.`);
      return false;
    }
    return true;
  };

  const handleQuickAction = (action, permissionKey) => {
    if (!ensurePermission(permissionKey)) {
      return;
    }
    safeAlert(`${action} for "${report.name}" will be available soon.`);
  };

  const handleMenuAction = async (action) => {
    const permissionMap = {
      edit: 'canEdit',
      duplicate: 'canDuplicate',
      share: 'canShare',
      archive: 'canArchive',
      delete: 'canDelete',
    };
    const permissionKey = permissionMap[action];
    if (!ensurePermission(permissionKey, `${toTitleCase(action)} is disabled while this report is ${statusConfig.label.toLowerCase()}.`)) {
      return;
    }
    const needsConfirm = action === 'archive' || action === 'delete';
    if (needsConfirm) {
      const confirmed = safeConfirm(`Are you sure you want to ${action} "${report.name}"?`);
      if (!confirmed) {
        return;
      }
    }
    
    // Call the appropriate callback
    try {
      switch (action) {
        case 'edit':
          if (onEdit) {
            onEdit(report);
          } else {
            safeAlert(`Edit functionality for "${report.name}" will be available soon.`);
          }
          break;
        case 'duplicate':
          if (onDuplicate) {
            await onDuplicate(report);
          } else {
            safeAlert(`Duplicate functionality for "${report.name}" will be available soon.`);
          }
          break;
        case 'share':
          if (onShare) {
            onShare(report);
          } else {
            safeAlert(`Share functionality for "${report.name}" will be available soon.`);
          }
          break;
        case 'archive':
          if (onArchive) {
            await onArchive(report);
          } else {
            safeAlert(`Archive functionality for "${report.name}" completed.`);
          }
          break;
        case 'delete':
          if (onDelete) {
            await onDelete(report);
          } else {
            safeAlert(`Delete functionality for "${report.name}" completed.`);
          }
          break;
        default:
          safeAlert(`${toTitleCase(action)} for "${report.name}" queued.`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      safeAlert(`Failed to ${action} "${report.name}". Please try again.`);
    }
  };

  const triggerExport = (format) => {
    if (!ensurePermission('canExport', `${statusConfig.label} reports cannot be exported.`)) {
      return;
    }
    if (onExport) {
      onExport(report, format);
      return;
    }
    const label = format === 'pdf' ? 'Generate PDF' : format === 'excel' ? 'Export Excel' : 'Export Data Bundle';
    handleQuickAction(label);
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border p-5 transition-all duration-200',
        // when selected, emphasize with themed border/background and stronger shadow
        selected
          ? 'border-[#BA7967] bg-[#FFF8F6] shadow-md'
          : 'border-[#E6E1D7] bg-white shadow-sm hover:shadow-md',
        viewMode === 'list' && 'md:flex-row md:items-start md:gap-6'
      )}
      role="group"
      aria-checked={selected}
    >
      {/* Header: Checkbox + Status + Title */}
      <div className="flex items-start gap-3 mb-4">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect()}
          aria-label={selected ? 'Deselect report' : 'Select report'}
          className="mt-1.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
            <Badge variant="outline" className="border-[#BA7967]/30 text-[#6b5b59] text-xs">
              {toTitleCase(report.category || 'Uncategorised')}
            </Badge>
            {report.version && (
              <Badge variant="outline" className="border-[#BA7967]/30 text-[#6b5b59] text-xs">
                v{report.version}
              </Badge>
            )}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-[#181814] leading-snug mb-1.5">
            {report.name}
          </h3>
          {report.description && (
            <p className="line-clamp-2 text-xs text-[#6b5b59] leading-relaxed">
              {report.description}
            </p>
          )}
        </div>
      </div>

      {/* Metrics - compact grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-b border-[#E6E1D7]">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="flex items-center gap-1.5 rounded-lg bg-[#F8F6F2] px-2.5 py-2"
          >
            <metric.icon className="h-3.5 w-3.5 text-[#BA7967] flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#3d3635] truncate">{metric.value}</span>
              <span className="text-[10px] text-[#6b5b59] uppercase tracking-wide">{metric.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata - cleaner two-column layout */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center gap-2 text-[#6b5b59]">
          <Layers className="h-3.5 w-3.5 text-[#BA7967] flex-shrink-0" />
          <span className="font-medium text-[#3d3635]">Metal:</span>
          <span className="truncate">{metalInfo.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[#6b5b59]">
          <Factory className="h-3.5 w-3.5 text-[#BA7967] flex-shrink-0" />
          <span className="font-medium text-[#3d3635]">Process:</span>
          <span className="truncate">{processLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-[#6b5b59]">
          <UserRound className="h-3.5 w-3.5 text-[#BA7967] flex-shrink-0" />
          <span className="font-medium text-[#3d3635]">By:</span>
          <span className="truncate">{formatAuthor(report.generatedBy)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#E6E1D7]/50">
          <div className="flex items-center gap-1.5 text-[#6b5b59]">
            <Calendar className="h-3 w-3 text-[#BA7967]" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#6b5b59]">
            <Clock3 className="h-3 w-3 text-[#BA7967]" />
            <span>{formatDate(report.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Actions - consolidated and cleaner */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#E6E1D7]">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] text-xs h-8"
            onClick={() => handleQuickAction('View report')}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] text-xs h-8"
                disabled={!resolvedPolicy.canExport}
                title={!resolvedPolicy.canExport ? `Exports are disabled for ${statusConfig.label} reports.` : undefined}
              >
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => triggerExport('pdf')}>
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => triggerExport('excel')}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => triggerExport('bundle')}>
                <Package className="h-3.5 w-3.5" />
                Data Bundle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] disabled:cursor-not-allowed disabled:opacity-60 text-xs h-8"
            onClick={() => handleQuickAction('Compare reports', 'canCompare')}
            disabled={!resolvedPolicy.canCompare}
            title={!resolvedPolicy.canCompare ? `Compare is unavailable while this report is ${statusConfig.label.toLowerCase()}.` : undefined}
          >
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />
            Compare
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] text-xs h-8"
              >
                <MoreHorizontal className="h-3.5 w-3.5 mr-1.5" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => handleMenuAction('edit')} disabled={!resolvedPolicy.canEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleMenuAction('duplicate')} disabled={!resolvedPolicy.canDuplicate}>
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleMenuAction('share')} disabled={!resolvedPolicy.canShare}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleMenuAction('archive')} disabled={!resolvedPolicy.canArchive}>
                <Archive className="h-3.5 w-3.5" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => handleMenuAction('delete')}
                disabled={!resolvedPolicy.canDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
