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

const ReportCard = ({ report, selected, onToggleSelect, onExport, viewMode = 'grid', statusPolicies = {} }) => {
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

  const handleMenuAction = (action) => {
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
    safeAlert(`${toTitleCase(action)} for "${report.name}" queued.`);
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
        'flex flex-col gap-4 rounded-2xl border border-[#E6E1D7] bg-white p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md',
        viewMode === 'list' && 'md:flex-row md:items-start md:gap-6'
      )}
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect()}
              aria-label={selected ? 'Deselect report' : 'Select report'}
              className="mt-1"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                    statusConfig.className
                  )}
                >
                  {statusConfig.label}
                </span>
                <Badge variant="outline" className="border-[#BA7967]/40 text-[#6b5b59]">
                  {toTitleCase(report.category || 'Uncategorised')}
                </Badge>
                {report.version && (
                  <Badge variant="outline" className="border-[#BA7967]/40 text-[#6b5b59]">
                    v{report.version}
                  </Badge>
                )}
              </div>
              <h3 className="line-clamp-2 text-lg font-semibold text-[#181814] md:text-xl">
                {report.name}
              </h3>
              {report.description && (
                <p className="line-clamp-2 text-sm text-[#6b5b59]">
                  {report.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <Badge
              key={metric.key}
              variant="outline"
              className="flex items-center gap-1 border-[#BA7967]/30 bg-[#F8F6F2] text-[#3d3635]"
            >
              <metric.icon className="h-3.5 w-3.5 text-[#BA7967]" />
              <span className="font-medium">{metric.value}</span>
              <span className="text-xs text-[#6b5b59]">{metric.label}</span>
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 text-sm text-[#6b5b59] sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#BA7967]" />
            <span className="font-medium text-[#3d3635]">Metal:</span>
            <span>{metalInfo.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-[#BA7967]" />
            <span className="font-medium text-[#3d3635]">Process:</span>
            <span>{processLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#BA7967]" />
            <span className="font-medium text-[#3d3635]">Created:</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#BA7967]" />
            <span className="font-medium text-[#3d3635]">Updated:</span>
            <span>{formatDate(report.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <UserRound className="h-4 w-4 text-[#BA7967]" />
            <span className="font-medium text-[#3d3635]">Author:</span>
            <span>{formatAuthor(report.generatedBy)}</span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-2',
          viewMode === 'list' ? 'md:w-[220px]' : 'md:w-full'
        )}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
            onClick={() => handleQuickAction('View report')}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => triggerExport('pdf')}
            disabled={!resolvedPolicy.canExport}
            title={!resolvedPolicy.canExport ? `Exports are disabled for ${statusConfig.label} reports.` : undefined}
          >
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => triggerExport('excel')}
            disabled={!resolvedPolicy.canExport}
            title={!resolvedPolicy.canExport ? `Exports are disabled for ${statusConfig.label} reports.` : undefined}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => triggerExport('bundle')}
            disabled={!resolvedPolicy.canExport}
            title={!resolvedPolicy.canExport ? `Exports are disabled for ${statusConfig.label} reports.` : undefined}
          >
            <Package className="h-4 w-4" />
            Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleQuickAction('Compare reports', 'canCompare')}
            disabled={!resolvedPolicy.canCompare}
            title={!resolvedPolicy.canCompare ? `Compare is unavailable while this report is ${statusConfig.label.toLowerCase()}.` : undefined}
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="justify-between border border-dashed border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
            >
              <span>More actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Manage report</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => handleMenuAction('edit')} disabled={!resolvedPolicy.canEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleMenuAction('duplicate')} disabled={!resolvedPolicy.canDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleMenuAction('share')} disabled={!resolvedPolicy.canShare}>
              <Share2 className="h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleMenuAction('archive')} disabled={!resolvedPolicy.canArchive}>
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleMenuAction('delete')}
              disabled={!resolvedPolicy.canDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ReportCard;
