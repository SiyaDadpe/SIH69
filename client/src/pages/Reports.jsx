import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Activity,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Download,
    Filter,
    Grid3x3,
    LayoutList,
    Search,
    ShieldAlert,
    Sparkles,
    X,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
// import reportsData from '@/data/reports.json';
import { 
  fetchReports, 
  bulkExportReports,
  updateReport,
  duplicateReport,
  archiveReport,
  deleteReport,
  shareReport
} from '@/services/reportService';
import { getUserLCAReports } from '@/services/lcaService';
import reportFiltersData from '@/data/reportFilters.json';
import ReportCard from '@/sections/reports/ReportCard';
import LCAReportCard from '@/sections/reports/LCAReportCard';
import FiltersPanel from '@/sections/reports/FiltersPanel';
import BulkActions from '@/sections/reports/BulkActions';
import ExportReportDialog from '@/components/ExportReportDialog';
import { toast } from 'sonner';
import AnalyticsDashboard from '@/sections/reports/AnalyticsDashboard';

const tabs = ['Active', 'Completed', 'Archived', 'All', 'LCA Reports'];
const PAGE_SIZE = 9;

const sortOptions = [
    { label: 'Updated (Newest)', value: 'updated-desc' },
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Circularity Score', value: 'score-desc' },
];

const STATUS_POLICIES = {
    default: {},
    draft: {
        canExport: false,
    },
    final: {},
    published: {
        canEdit: false,
        canDelete: false,
    },
    archived: {
        canExport: false,
        canEdit: false,
        canDuplicate: false,
        canShare: false,
        canArchive: false,
        canCompare: false,
    },
};

const TAB_STATUS_MAP = {
    active: ['draft', 'final'],
    completed: ['published'],
    archived: ['archived'],
    all: null,
    'lca reports': 'lca',
};

const STORAGE_KEY = 'reports.savedFilters';
const DEFAULT_FILTER_STORAGE_KEY = 'reports.defaultFilterId';

const BASE_FILTERS = {
    metalTypes: [],
    processes: [],
    tags: [],
    author: 'any',
    status: 'any',
    dateRange: { from: undefined, to: undefined },
    circularity: [0, 100],
};

const cloneFilters = (input) => {
    const source = input || {};
    return {
        metalTypes: Array.isArray(source.metalTypes) ? [...source.metalTypes] : [],
        processes: Array.isArray(source.processes) ? [...source.processes] : [],
        tags: Array.isArray(source.tags) ? [...source.tags] : [],
        author: source.author ?? 'any',
        status: source.status ?? 'any',
        dateRange: {
            from: source.dateRange?.from ?? undefined,
            to: source.dateRange?.to ?? undefined,
        },
        circularity: Array.isArray(source.circularity)
            ? [...source.circularity]
            : [0, 100],
    };
};

const Reports = () => {
    // Declare all state at the top, before any useEffect/useMemo
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(() => cloneFilters(BASE_FILTERS));
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState('default');
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [totalReports, setTotalReports] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [lcaReports, setLcaReports] = useState([]);
    const [loadingLCAReports, setLoadingLCAReports] = useState(false);
    const availableFilters = useMemo(
        () => (Array.isArray(reportFiltersData) ? reportFiltersData.length : 0),
        []
    );

    useEffect(() => {
        const normalizedTab = activeTab.toLowerCase();
        
        // Handle LCA Reports tab separately
        if (normalizedTab === 'lca reports') {
            setLoadingLCAReports(true);
            const lcaParams = {
                page: currentPage,
                limit: PAGE_SIZE,
            };
            if (searchTerm.trim()) {
                lcaParams.search = searchTerm.trim();
            }
            getUserLCAReports(lcaParams)
                .then((response) => {
                    console.log('📊 LCA Reports Response:', response);
                    const reports = response.data?.reports || [];
                    const pagination = response.data?.pagination || {};
                    
                    setLcaReports(Array.isArray(reports) ? reports : []);
                    setTotalReports(pagination.total || 0);
                    setTotalPages(pagination.pages || 1);
                })
                .catch((err) => {
                    console.error('Failed to load LCA reports:', err);
                    setLcaReports([]);
                    setTotalReports(0);
                    setTotalPages(1);
                    toast.error('Failed to load LCA reports from server');
                })
                .finally(() => setLoadingLCAReports(false));
            return;
        }

        // Regular reports logic
        setLoadingReports(true);
        // Build backend query params
        const params = {};
        // Tab status
        const allowedStatuses = TAB_STATUS_MAP[normalizedTab] || null;
        if (allowedStatuses && allowedStatuses.length === 1) {
            params.status = allowedStatuses[0];
        }
        // Search
        if (searchTerm.trim()) {
            params.search = searchTerm.trim();
        }
        // Filters
        if (filters.status && filters.status !== 'any') {
            params.status = filters.status;
        }
        if (filters.author && filters.author !== 'any') {
            params['author'] = filters.author;
        }
        if (filters.tags && filters.tags.length > 0) {
            params.tags = filters.tags.join(',');
        }
        if (filters.metalTypes && filters.metalTypes.length > 0) {
            params.tags = (params.tags ? params.tags + ',' : '') + filters.metalTypes.join(',');
        }
        if (filters.processes && filters.processes.length > 0) {
            params.tags = (params.tags ? params.tags + ',' : '') + filters.processes.join(',');
        }
        // Date range
        if (filters.dateRange?.from) {
            params.from = filters.dateRange.from;
        }
        if (filters.dateRange?.to) {
            params.to = filters.dateRange.to;
        }
        // Circularity (handled client-side for now)
        // Pagination
        params.page = currentPage;
        params.limit = PAGE_SIZE;
        // Sorting
        if (sortOption === 'name-asc') {
            params.sort = 'name';
        } else if (sortOption === 'score-desc') {
            params.sort = '-summary.circularityScore';
        } else {
            params.sort = '-updatedAt';
        }
        fetchReports(params)
            .then((data) => {
                setReports(Array.isArray(data.reports) ? data.reports : data);
                setTotalReports(data.pagination?.totalReports || 0);
                setTotalPages(data.pagination?.totalPages || 1);
            })
            .catch((err) => {
                setReports([]);
                setTotalReports(0);
                setTotalPages(1);
                toast.error('Failed to load reports from server');
            })
            .finally(() => setLoadingReports(false));
    }, [activeTab, searchTerm, filters, currentPage, sortOption, refreshTrigger]);

    // Function to refresh the reports list
    const loadReports = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const metadataOptions = useMemo(() => {
        const metalKeywords = new Set(['aluminum', 'aluminium', 'copper', 'steel', 'tailings', 'residuals', 'mixed', 'iron', 'nickel']);
        const metals = new Set();
        const processes = new Set();
        const authors = new Set();
        const tags = new Set();

        const toTitle = (value) =>
            String(value)
                .replace(/[_-]+/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());

        reports.forEach((report) => {
            (report.tags || []).forEach((tag) => {
                const normalized = String(tag).toLowerCase();
                tags.add(toTitle(tag));
                if (metalKeywords.has(normalized)) {
                    metals.add(toTitle(tag));
                } else {
                    processes.add(toTitle(tag));
                }
            });

            if (report.generatedBy) {
                authors.add(report.generatedBy);
            }
        });

        return {
            metals: Array.from(metals).sort(),
            processes: Array.from(processes).sort(),
            authors: Array.from(authors).sort(),
            tags: Array.from(tags).sort(),
        };
    }, [reports]);

    // (already declared above)
    const [savedFilters, setSavedFilters] = useState(() => {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return [];
            }
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.map((item) => ({
                ...item,
                filters: cloneFilters(item.filters),
            }));
        } catch (error) {
            console.error('Failed to parse saved filters', error);
            return [];
        }
    });
    const [defaultFilterId, setDefaultFilterId] = useState(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            return window.localStorage.getItem(DEFAULT_FILTER_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to read default filter id', error);
            return null;
        }
    });
    const [activeSharedFilterId, setActiveSharedFilterId] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const defaultFilter = useMemo(
        () => savedFilters.find((item) => item.id === defaultFilterId) || null,
        [savedFilters, defaultFilterId]
    );

    const sharedFilters = useMemo(
        () => savedFilters.filter((item) => item.shared),
        [savedFilters]
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
        } catch (error) {
            console.error('Failed to persist saved filters', error);
        }
    }, [savedFilters]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            if (defaultFilterId) {
                window.localStorage.setItem(DEFAULT_FILTER_STORAGE_KEY, defaultFilterId);
            } else {
                window.localStorage.removeItem(DEFAULT_FILTER_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to persist default filter id', error);
        }
    }, [defaultFilterId]);

    useEffect(() => {
        if (!defaultFilter) {
            return;
        }
        setFilters(cloneFilters(defaultFilter.filters));
        setActiveSharedFilterId(defaultFilter.shared ? defaultFilter.id : null);
    }, [defaultFilter]);

    const handleFiltersChange = useCallback(
        (updater) => {
            setFilters((previous) => {
                const base = cloneFilters(previous);
                const next = typeof updater === 'function' ? updater(base) : updater;
                return cloneFilters(next);
            });
            setActiveSharedFilterId(null);
        },
        [setActiveSharedFilterId]
    );

    const handleSaveFilter = useCallback(
        ({ name, shared }) => {
            const trimmedName = name.trim();
            if (!trimmedName) {
                return null;
            }
            const id =
                typeof window !== 'undefined' && window.crypto?.randomUUID
                    ? window.crypto.randomUUID()
                    : `filter-${Date.now()}`;
            const payload = {
                id,
                name: trimmedName,
                shared: Boolean(shared),
                filters: cloneFilters(filters),
                createdAt: new Date().toISOString(),
            };
            setSavedFilters((prev) => [...prev, payload]);
            if (payload.shared) {
                setActiveSharedFilterId(payload.id);
            }
            return payload;
        },
        [filters]
    );

    const handleLoadSavedFilter = useCallback(
        (filterId) => {
            const target = savedFilters.find((item) => item.id === filterId);
            if (!target) {
                return;
            }
            setFilters(cloneFilters(target.filters));
            setShowAdvanced(true);
            setActiveSharedFilterId(target.shared ? target.id : null);
        },
        [savedFilters, setShowAdvanced]
    );

    const handleDeleteSavedFilter = useCallback(
        (filterId) => {
            setSavedFilters((prev) => prev.filter((item) => item.id !== filterId));
            if (defaultFilterId === filterId) {
                setDefaultFilterId(null);
            }
            if (activeSharedFilterId === filterId) {
                setActiveSharedFilterId(null);
            }
        },
        [defaultFilterId, activeSharedFilterId]
    );

    const handleUpdateSavedFilter = useCallback((filterId, patch) => {
        setSavedFilters((prev) =>
            prev.map((item) =>
                item.id === filterId
                    ? {
                          ...item,
                          ...patch,
                          filters: patch.filters ? cloneFilters(patch.filters) : item.filters,
                      }
                    : item
            )
        );
    }, []);

    const handleSetDefaultFilter = useCallback((filterId) => {
        setDefaultFilterId((current) => (current === filterId ? null : filterId));
    }, []);

    const handleSafeSearchTerm = useCallback((value) => {
        try {
            setSearchTerm(value);
        } catch (error) {
            console.error('Failed to update search term', error);
            toast.error('Unable to apply the search query. Please try again.');
        }
    }, []);

    const handleClearAll = useCallback(() => {
        setSearchTerm('');
        if (defaultFilter) {
            setFilters(cloneFilters(defaultFilter.filters));
            setActiveSharedFilterId(defaultFilter.shared ? defaultFilter.id : null);
        } else {
            setFilters(cloneFilters(BASE_FILTERS));
            setActiveSharedFilterId(null);
        }
    }, [defaultFilter, setSearchTerm, setFilters, setActiveSharedFilterId]);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    // (already declared above)
    // (already declared above)
    const [selectedReports, setSelectedReports] = useState([]);
    const [exportJobs, setExportJobs] = useState([]);
    const jobTimersRef = useRef({});
    const listLoadingRef = useRef(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportTarget, setExportTarget] = useState(null);
    const [exportFormat, setExportFormat] = useState('pdf');
    const [isLoading, setIsLoading] = useState(false);
    const handleOpenExport = useCallback((report, format = 'pdf') => {
        try {
            setExportTarget(report);
            setExportFormat(format);
            setShowExportModal(true);
        } catch (error) {
            console.error('Failed to open export modal', error);
            toast.error('Unable to open export options. Please try again.');
        }
    }, []);

    const handleCloseExport = useCallback(() => {
        setShowExportModal(false);
        setExportTarget(null);
        setExportFormat('pdf');
    }, []);

    // Handler: Edit Report
    const handleEdit = useCallback((report) => {
        console.log('Edit report:', report);
        toast.info(`Editing "${report.name || report.title}" - Feature coming soon!`);
        // TODO: Navigate to edit page or open edit modal
        // navigate(`/reports/${report._id}/edit`);
    }, []);

    // Handler: Duplicate Report
    const handleDuplicate = useCallback(async (report) => {
        try {
            toast.loading('Duplicating report...');
            const duplicated = await duplicateReport(report._id);
            toast.success(`Successfully duplicated "${report.name || report.title}"`);
            // Refresh the reports list
            loadReports();
        } catch (error) {
            console.error('Failed to duplicate report:', error);
            toast.error('Failed to duplicate report. Please try again.');
        }
    }, []);

    // Handler: Share Report
    const handleShare = useCallback((report) => {
        console.log('Share report:', report);
        toast.info(`Sharing "${report.name || report.title}" - Feature coming soon!`);
        // TODO: Open share dialog with visibility options
    }, []);

    // Handler: Archive Report
    const handleArchive = useCallback(async (report) => {
        try {
            toast.loading('Archiving report...');
            await archiveReport(report._id);
            toast.success(`"${report.name || report.title}" has been archived`);
            // Refresh the reports list
            loadReports();
        } catch (error) {
            console.error('Failed to archive report:', error);
            toast.error('Failed to archive report. Please try again.');
        }
    }, []);

    // Handler: Delete Report
    const handleDelete = useCallback(async (report) => {
        try {
            toast.loading('Deleting report...');
            await deleteReport(report._id);
            toast.success(`"${report.name || report.title}" has been deleted`);
            // Refresh the reports list
            loadReports();
        } catch (error) {
            console.error('Failed to delete report:', error);
            toast.error('Failed to delete report. Please try again.');
        }
    }, []);

    const clearAllJobTimers = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        Object.values(jobTimersRef.current).forEach((timerId) => {
            if (timerId) {
                window.clearInterval(timerId);
            }
        });
    }, [jobTimersRef]);

    // Optionally, fetch stats from backend if available, else fallback to local calculation
    const stats = useMemo(() => {
        const counts = { active: 0, completed: 0, archived: 0, lca: lcaReports.length };
        reports.forEach((report) => {
            const status = (report.status || 'draft').toLowerCase();
            if (TAB_STATUS_MAP.active.includes(status)) {
                counts.active += 1;
            } else if (TAB_STATUS_MAP.completed.includes(status)) {
                counts.completed += 1;
            } else if (TAB_STATUS_MAP.archived.includes(status)) {
                counts.archived += 1;
            }
        });
        return counts;
    }, [reports, lcaReports]);

    // All filtering, sorting, and pagination is now backend-driven
    const filteredReports = reports;

    const sortedReports = filteredReports;
    // totalPages is now backend-driven
    const appliedFilterChips = useMemo(() => {
        const chips = [];
        const toTitle = (value) =>
            String(value)
                .replace(/[_-]+/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());

        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch) {
            chips.push({
                key: 'search',
                label: `Search: ${trimmedSearch}`,
                onRemove: () => setSearchTerm(''),
            });
        }

        filters.metalTypes.forEach((metal) => {
            chips.push({
                key: `metal-${metal}`,
                label: `Metal: ${toTitle(metal)}`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        metalTypes: prev.metalTypes.filter((item) => item !== metal),
                    })),
            });
        });

        filters.processes.forEach((process) => {
            chips.push({
                key: `process-${process}`,
                label: `Process: ${toTitle(process)}`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        processes: prev.processes.filter((item) => item !== process),
                    })),
            });
        });

        filters.tags.forEach((tag) => {
            chips.push({
                key: `tag-${tag}`,
                label: `Tag: ${toTitle(tag)}`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((item) => item !== tag),
                    })),
            });
        });

        if (filters.author && filters.author !== 'any') {
            chips.push({
                key: `author-${filters.author}`,
                label: `Author: ${filters.author}`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        author: 'any',
                    })),
            });
        }

        if (filters.status && filters.status !== 'any') {
            chips.push({
                key: `status-${filters.status}`,
                label: `Status: ${toTitle(filters.status)}`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        status: 'any',
                    })),
            });
        }

        if (filters.dateRange?.from) {
            const from = new Date(filters.dateRange.from);
            if (Number.isFinite(from.getTime())) {
                chips.push({
                    key: 'date-from',
                    label: `From: ${from.toLocaleDateString('en-IN')}`,
                    onRemove: () =>
                        handleFiltersChange((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: undefined },
                        })),
                });
            }
        }

        if (filters.dateRange?.to) {
            const to = new Date(filters.dateRange.to);
            if (Number.isFinite(to.getTime())) {
                chips.push({
                    key: 'date-to',
                    label: `To: ${to.toLocaleDateString('en-IN')}`,
                    onRemove: () =>
                        handleFiltersChange((prev) => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: undefined },
                        })),
                });
            }
        }

        const [minCircularity, maxCircularity] = filters.circularity || [0, 100];
        if (minCircularity > 0 || maxCircularity < 100) {
            chips.push({
                key: 'circularity',
                label: `Circularity: ${minCircularity}% – ${maxCircularity}%`,
                onRemove: () =>
                    handleFiltersChange((prev) => ({
                        ...prev,
                        circularity: [0, 100],
                    })),
            });
        }

        if (activeSharedFilterId) {
            const sharedFilter = savedFilters.find((item) => item.id === activeSharedFilterId);
            if (sharedFilter) {
                chips.push({
                    key: `shared-${sharedFilter.id}`,
                    label: `Shared preset: ${sharedFilter.name}`,
                    onRemove: () => setActiveSharedFilterId(null),
                });
            }
        }

        return chips;
    }, [
        searchTerm,
        filters,
        handleFiltersChange,
        savedFilters,
        activeSharedFilterId,
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm, sortOption, filters]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return undefined;
        }
        setIsLoading(true);
        if (listLoadingRef.current) {
            window.clearTimeout(listLoadingRef.current);
        }
        listLoadingRef.current = window.setTimeout(() => {
            setIsLoading(false);
        }, 280);
        return () => {
            if (listLoadingRef.current) {
                window.clearTimeout(listLoadingRef.current);
            }
        };
    }, [activeTab, searchTerm, sortOption, filters]);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);

    useEffect(() => {
        return () => {
            clearAllJobTimers();
        };
    }, [clearAllJobTimers]);

    const visibleReports = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return sortedReports.slice(start, start + PAGE_SIZE);
    }, [sortedReports, currentPage]);

    const totalFilteredCount = filteredReports.length;

    const handleSelectAll = useCallback(() => {
        if (totalFilteredCount === 0) {
            setSelectedReports([]);
            return;
        }
        const allIds = filteredReports.map((report) => report.id);
        setSelectedReports(allIds);
    }, [filteredReports, totalFilteredCount]);

    const clearSelection = useCallback(() => {
        setSelectedReports([]);
    }, []);

    const handleBulkExport = useCallback(
        async (format) => {
            try {
                if (selectedReports.length === 0) {
                    toast.info('Select at least one report to export.');
                    return;
                }
                const count = selectedReports.length;
                const jobId =
                    typeof window !== 'undefined' && window.crypto?.randomUUID
                        ? window.crypto.randomUUID()
                        : `bulk-${Date.now()}`;
                const label = format === 'excel-multi' ? 'Excel workbook' : 'PDF bundle';
                const loadingMessage =
                    format === 'excel-multi'
                        ? `Generating Excel workbook for ${count} report${count === 1 ? '' : 's'}…`
                        : `Compiling PDF bundle for ${count} report${count === 1 ? '' : 's'}…`;
                const toastId = toast.loading(loadingMessage);
                setExportJobs((prev) => [
                    ...prev,
                    {
                        id: jobId,
                        format,
                        label,
                        status: 'running',
                        progress: 0,
                        count,
                        createdAt: Date.now(),
                    },
                ]);
                // Call backend bulk export endpoint
                const backendFormat = format === 'excel-multi' ? 'excel' : 'pdf';
                const response = await bulkExportReports({
                    reportIds: selectedReports,
                    format: backendFormat,
                });
                // Download file
                const blob = new Blob([response.data], {
                    type:
                        backendFormat === 'excel'
                            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            : 'application/pdf',
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download =
                    backendFormat === 'excel'
                        ? 'reports-bundle.xlsx'
                        : 'reports-bundle.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                // Mark job as completed
                setExportJobs((prev) =>
                    prev.map((job) =>
                        job.id === jobId
                            ? { ...job, progress: 100, status: 'completed' }
                            : job
                    )
                );
                toast.success(`${label} ready`, {
                    id: toastId,
                    description: `${count} report${count === 1 ? '' : 's'} exported successfully.`,
                });
                setTimeout(() => {
                    setExportJobs((prev) => prev.filter((job) => job.id !== jobId));
                }, 8000);
            } catch (error) {
                console.error('Failed to queue bulk export', error);
                toast.error('Failed to queue export. Please retry.');
            }
        },
        [selectedReports]
    );

    const toggleSelection = useCallback((reportId) => {
        setSelectedReports((prev) =>
            prev.includes(reportId)
                ? prev.filter((id) => id !== reportId)
                : [...prev, reportId]
        );
    }, []);

    const hasSelection = selectedReports.length > 0;

    const activeJob = useMemo(() => {
        if (exportJobs.length === 0) {
            return null;
        }
        const runningJobs = exportJobs.filter((job) => job.status === 'running');
        if (runningJobs.length > 0) {
            return runningJobs[runningJobs.length - 1];
        }
        return exportJobs[exportJobs.length - 1];
    }, [exportJobs]);

    const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const resultLabel = `${sortedReports.length} report${sortedReports.length === 1 ? '' : 's'} found`;
    
    // Determine which reports to display based on active tab
    const displayReports = activeTab.toLowerCase() === 'lca reports' ? lcaReports : visibleReports;
    
    // Check loading state based on active tab
    const showLoadingState = activeTab.toLowerCase() === 'lca reports' ? loadingLCAReports : (loadingReports || isLoading);

    return (
        <div className="min-h-screen space-y-6 bg-[#FFFFFF] p-4 sm:p-6">
            <Card className="border-[#E6E1D7] bg-[#F3F2EC]">
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#BA7967] text-lg font-semibold text-white">
                                SIH
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center text-sm text-[#6b5b59]">
                                    <span>Home</span>
                                    <ChevronRight className="mx-1.5 h-4 w-4" />
                                    <span className="font-medium text-[#181814]">Reports</span>
                                </div>
                                <h1 className="text-2xl font-bold text-[#181814] sm:text-3xl">Reports Library</h1>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-[#BA7967]/30 bg-white p-4">
                            <p className="text-sm text-[#6b5b59]">Active Reports</p>
                            <p className="mt-2 text-2xl font-semibold text-[#181814]">{stats.active}</p>
                        </div>
                        <div className="rounded-xl border border-[#BA7967]/30 bg-white p-4">
                            <p className="text-sm text-[#6b5b59]">Completed Reports</p>
                            <p className="mt-2 text-2xl font-semibold text-[#181814]">{stats.completed}</p>
                        </div>
                        <div className="rounded-xl border border-[#BA7967]/30 bg-white p-4">
                            <p className="text-sm text-[#6b5b59]">Archived Reports</p>
                            <p className="mt-2 text-2xl font-semibold text-[#181814]">{stats.archived}</p>
                        </div>
                        <div className="rounded-xl border border-[#BA7967]/30 bg-white p-4">
                            <p className="text-sm text-[#6b5b59]">LCA Reports</p>
                            <p className="mt-2 text-2xl font-semibold text-[#181814]">{stats.lca}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4 rounded-2xl border border-[#E6E1D7] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {tabs.map((tab) => (
                            <Button
                                key={tab}
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium transition-colors',
                                    activeTab === tab
                                        ? 'bg-[#BA7967] text-white hover:bg-[#3d3635]'
                                        : 'text-[#3d3635] hover:bg-[#F3F2EC]'
                                )}
                            >
                                {tab}
                            </Button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={sortOption} onValueChange={setSortOption}>
                            <SelectTrigger className="min-w-[180px] border-[#BA7967]/40 text-left text-[#3d3635] hover:bg-[#F3F2EC]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'text-[#3d3635] hover:bg-[#F3F2EC]',
                                viewMode === 'grid' && 'bg-[#BA7967]/10'
                            )}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'text-[#3d3635] hover:bg-[#F3F2EC]',
                                viewMode === 'list' && 'bg-[#BA7967]/10'
                            )}
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                            onClick={() => setShowFilters((prev) => !prev)}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="flex-1">
                        <FiltersPanel
                            searchTerm={searchTerm}
                            setSearchTerm={handleSafeSearchTerm}
                            showAdvanced={showAdvanced}
                            setShowAdvanced={setShowAdvanced}
                            filters={filters}
                            setFilters={handleFiltersChange}
                            options={metadataOptions}
                            onClear={handleClearAll}
                            savedFilters={savedFilters}
                            onSaveFilter={handleSaveFilter}
                            onLoadSavedFilter={handleLoadSavedFilter}
                            onDeleteSavedFilter={handleDeleteSavedFilter}
                            onUpdateSavedFilter={handleUpdateSavedFilter}
                            defaultFilterId={defaultFilterId}
                            onSetDefaultFilter={handleSetDefaultFilter}
                            sharedFilters={sharedFilters}
                            activeSharedFilterId={activeSharedFilterId}
                            onSelectSharedFilter={handleLoadSavedFilter}
                            onClearSharedFilter={() => setActiveSharedFilterId(null)}
                        />
                    </div>
                </div>

                {appliedFilterChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-[#BA7967]/40 bg-[#F8F6F2] p-3">
                        {appliedFilterChips.map((chip) => (
                            <Badge
                                key={chip.key}
                                variant="outline"
                                className="flex items-center gap-2 border-[#BA7967]/40 bg-white text-[#3d3635]"
                            >
                                <span>{chip.label}</span>
                                <button
                                    type="button"
                                    onClick={chip.onRemove}
                                    className="rounded-full p-0.5 text-[#6b5b59] transition-colors hover:text-[#BA7967]"
                                    aria-label={`Remove ${chip.label}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}

                {showAdvanced && (
                    <div className="rounded-xl border border-dashed border-[#BA7967]/40 bg-[#F8F6F2] p-4 text-sm text-[#6b5b59]">
                        Configure advanced parameters here once endpoints are wired in.
                    </div>
                )}

                {showFilters && (
                    <div className="rounded-xl border border-dashed border-[#BA7967]/40 bg-[#F3F2EC] p-4 text-sm text-[#6b5b59]">
                        Filter panel placeholder loaded with {availableFilters} saved presets from reportFilters.json.
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="space-y-4 lg:w-2/3">
                    <Card className="border-[#E6E1D7] bg-white">
                        <CardHeader className="gap-3">
                            <CardTitle className="text-[#181814]">{activeTab} Reports</CardTitle>
                            <CardDescription className="text-[#6b5b59]">
                                Monitor generation progress, ownership, and compliance status at a glance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {showLoadingState ? (
                                <div
                                    className={cn(
                                        'gap-4',
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                                            : 'flex flex-col'
                                    )}
                                >
                                    {Array.from({ length: viewMode === 'grid' ? 6 : 3 }).map((_, index) => (
                                        <Card
                                            key={`skeleton-${index}`}
                                            className="border-[#E6E1D7] bg-white p-4 shadow-sm"
                                        >
                                            <CardContent className="space-y-4 p-0">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-3 w-20 rounded-full" />
                                                    <Skeleton className="h-3 w-12 rounded-full" />
                                                </div>
                                                <Skeleton className="h-5 w-3/4 rounded" />
                                                <Skeleton className="h-4 w-full rounded" />
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <Skeleton className="h-4 w-full rounded" />
                                                    <Skeleton className="h-4 w-full rounded" />
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <Skeleton className="h-9 w-full rounded" />
                                                    <Skeleton className="h-9 w-full rounded" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : displayReports.length === 0 ? (
                                <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[#BA7967]/40 bg-[#F8F6F2] p-10 text-center text-sm text-[#6b5b59]">
                                    <ClipboardList className="h-6 w-6 text-[#BA7967]" />
                                    <p className="font-medium text-[#3d3635]">
                                        No reports found in the {activeTab.toLowerCase()} category with the current filters.
                                    </p>
                                    <p>Adjust filters or launch the wizard to generate a new report.</p>
                                    <Button className="mt-2 bg-[#BA7967] text-white hover:bg-[#3d3635]">
                                        New Report Wizard
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm font-medium text-[#3d3635]">{resultLabel}</p>
                                        <p className="text-xs text-[#6b5b59]">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            'gap-4',
                                            viewMode === 'grid'
                                                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                                                : 'flex flex-col'
                                        )}
                                    >
                                        {activeTab.toLowerCase() === 'lca reports' ? (
                                            lcaReports.map((report) => (
                                                <LCAReportCard
                                                    key={report._id || report.workflowId}
                                                    report={report}
                                                    viewMode={viewMode}
                                                />
                                            ))
                                        ) : (
                                            visibleReports.map((report) => (
                                                <ReportCard
                                                    key={report.id}
                                                    report={report}
                                                    selected={selectedReports.includes(report.id)}
                                                    onToggleSelect={() => toggleSelection(report.id)}
                                                    onExport={handleOpenExport}
                                                    onEdit={handleEdit}
                                                    onDuplicate={handleDuplicate}
                                                    onShare={handleShare}
                                                    onArchive={handleArchive}
                                                    onDelete={handleDelete}
                                                    onRefresh={loadReports}
                                                    statusPolicies={STATUS_POLICIES}
                                                    viewMode={viewMode}
                                                />
                                            ))
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-3 border-t border-[#F3F2EC] pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-[#6b5b59]">
                                    Showing page {currentPage} of {totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 lg:w-1/3">
                    <AnalyticsDashboard reports={filteredReports} />

                    <Card className="border-[#E6E1D7] bg-white">
                        <CardHeader className="gap-2">
                            <CardTitle className="flex items-center gap-2 text-[#181814]">
                                <Sparkles className="h-5 w-5 text-[#BA7967]" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            <Button className="justify-start bg-[#BA7967] text-white hover:bg-[#3d3635]">
                                Launch Wizard
                            </Button>
                            <Button variant="outline" className="justify-start border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]">
                                Upload External Report
                            </Button>
                            <Button variant="outline" className="justify-start border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]">
                                Schedule Review Session
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-[#E6E1D7] bg-white">
                        <CardHeader className="gap-2">
                            <CardTitle className="flex items-center gap-2 text-[#181814]">
                                <Activity className="h-5 w-5 text-[#BA7967]" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-[#6b5b59]">
                            <div className="rounded-lg border border-dashed border-[#BA7967]/30 p-3">
                                Activity feed will list approvals, comments, and export events.
                            </div>
                            <p className="text-xs text-[#3d3635]">Stay tuned for live updates as collaboration hooks go live.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-[#E6E1D7] bg-white">
                        <CardHeader className="gap-2">
                            <CardTitle className="flex items-center gap-2 text-[#181814]">
                                <ShieldAlert className="h-5 w-5 text-[#BA7967]" />
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-[#6b5b59]">
                            <p>No alerts right now. Compliance, expirations, and risk notices will display here.</p>
                            <Button variant="ghost" className="justify-start px-0 text-[#BA7967] hover:text-[#3d3635]">
                                Manage notification rules
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <BulkActions
                selectedCount={selectedReports.length}
                totalCount={totalFilteredCount}
                onSelectAll={handleSelectAll}
                onClearSelection={clearSelection}
                onBulkExport={handleBulkExport}
                activeJob={activeJob}
            />

            <ExportReportDialog
                open={showExportModal}
                report={exportTarget}
                onOpenChange={(open) => {
                    setShowExportModal(open);
                    if (!open) {
                        setExportTarget(null);
                        setExportFormat('pdf');
                    }
                }}
            />
        </div>
    );
};

export default Reports;