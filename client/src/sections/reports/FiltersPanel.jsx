import React, { useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as DateRangeCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
    Calendar as CalendarIcon,
    ChevronDown,
    Copy,
    Plus,
    Share2,
    Star,
    Trash2,
    Search,
    X,
} from 'lucide-react';

const statusOptions = [
    { label: 'Any', value: 'any' },
    { label: 'Draft', value: 'draft' },
    { label: 'Final', value: 'final' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
];

const defaultOptions = { metals: [], processes: [], authors: [], tags: [] };

const toTitle = (value) =>
    String(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

const MultiSelectField = ({
    label,
    placeholder,
    options,
    selected = [],
    onToggle,
    formatLabel = (value) => value,
}) => {
    const displayValue = selected.length > 0 ? `${selected.length} selected` : placeholder;

    return (
        <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                {label}
            </label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="mt-2 w-full justify-between rounded-lg border-[#BA7967]/40 bg-white text-left font-normal text-[#3d3635] hover:bg-[#F3F2EC]"
                    >
                        <span className="truncate">{displayValue}</span>
                        <ChevronDown className="ml-2 h-4 w-4 text-[#BA7967]" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                    <div className="max-h-56 space-y-2 overflow-y-auto">
                        {options.length === 0 ? (
                            <p className="text-xs text-[#6b5b59]">No options available</p>
                        ) : (
                            options.map((option) => (
                                <label
                                    key={option}
                                    className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-[#3d3635] hover:bg-[#F8F6F2]"
                                >
                                    <Checkbox
                                        checked={selected.includes(option)}
                                        onCheckedChange={() => onToggle(option)}
                                    />
                                    <span>{formatLabel(option)}</span>
                                </label>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const FiltersPanel = ({
    searchTerm,
    setSearchTerm,
    showAdvanced,
    setShowAdvanced,
    filters,
    setFilters,
    options = defaultOptions,
    onClear,
    savedFilters = [],
    onSaveFilter,
    onLoadSavedFilter,
    onDeleteSavedFilter,
    onUpdateSavedFilter,
    defaultFilterId,
    onSetDefaultFilter,
    sharedFilters = [],
    activeSharedFilterId,
    onSelectSharedFilter,
    onClearSharedFilter = () => {},
}) => {
    const mergedOptions = React.useMemo(
        () => ({
            metals: options?.metals ?? [],
            processes: options?.processes ?? [],
            authors: options?.authors ?? [],
            tags: options?.tags ?? [],
        }),
        [options]
    );

    const update = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

    const toggleMultiValue = React.useCallback(
        (field, value) => {
            setFilters((prev) => {
                const current = Array.isArray(prev[field]) ? prev[field] : [];
                const exists = current.includes(value);
                const nextValues = exists
                    ? current.filter((item) => item !== value)
                    : [...current, value];
                return { ...prev, [field]: nextValues };
            });
        },
        [setFilters]
    );

    const [tagInput, setTagInput] = React.useState('');
    const [showSaveModal, setShowSaveModal] = React.useState(false);
    const [saveName, setSaveName] = React.useState('');
    const [saveAsShared, setSaveAsShared] = React.useState(false);
    const [saveError, setSaveError] = React.useState('');
    const [shareContext, setShareContext] = React.useState(null);
    const [copySuccess, setCopySuccess] = React.useState(false);

    const parseDateValue = (value) => {
        if (!value) {
            return undefined;
        }
        const parsed = value instanceof Date ? value : new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const fromDate = React.useMemo(
        () => parseDateValue(filters.dateRange?.from),
        [filters.dateRange?.from]
    );

    const toDate = React.useMemo(
        () => parseDateValue(filters.dateRange?.to),
        [filters.dateRange?.to]
    );

    const fromLabel = React.useMemo(
        () => (fromDate ? format(fromDate, 'MMM dd, yyyy') : 'Select from date'),
        [fromDate]
    );

    const toLabel = React.useMemo(
        () => (toDate ? format(toDate, 'MMM dd, yyyy') : 'Select to date'),
        [toDate]
    );

    const circularityRange = React.useMemo(() => {
        if (Array.isArray(filters.circularity) && filters.circularity.length === 2) {
            const a = Number(filters.circularity[0]) ?? 0;
            const b = Number(filters.circularity[1]) ?? 0;
            return [Math.min(a, b), Math.max(a, b)];
        }
        return [0, 100];
    }, [filters.circularity]);

    const availableTagSuggestions = React.useMemo(() => {
        const selectedLower = new Set((filters.tags || []).map((tag) => tag.toLowerCase()));
        return (mergedOptions.tags || []).filter(
            (tag) => !selectedLower.has(String(tag).toLowerCase())
        );
    }, [mergedOptions.tags, filters.tags]);

    const addTag = React.useCallback(
        (value) => {
            const trimmed = value.trim();
            if (!trimmed) {
                return;
            }
            const normalized = toTitle(trimmed);
            setFilters((prev) => {
                const existing = (prev.tags || []).map((tag) => tag.toLowerCase());
                if (existing.includes(normalized.toLowerCase())) {
                    return prev;
                }
                return { ...prev, tags: [...(prev.tags || []), normalized] };
            });
            setTagInput('');
        },
        [setFilters]
    );

    const removeTag = React.useCallback(
        (tag) => {
            setFilters((prev) => ({
                ...prev,
                tags: (prev.tags || []).filter((item) => item !== tag),
            }));
        },
        [setFilters]
    );

    const handleTagKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTag(tagInput);
        }
    };

    const buildShareLink = React.useCallback((preset) => {
        if (!preset) {
            return '';
        }
        const base =
            typeof window !== 'undefined' && window.location
                ? window.location.origin
                : 'https://reports.local';
        try {
            const payload = JSON.stringify(preset.filters || {});
            const encoded =
                typeof window !== 'undefined' && window.btoa
                    ? window.btoa(encodeURIComponent(payload))
                    : payload;
            return `${base}/reports?filter=${encoded}`;
        } catch (error) {
            console.error('Failed to build share link', error);
            return base;
        }
    }, []);

    const handleShare = (preset) => {
        if (!preset) {
            return;
        }
        if (!preset.shared) {
            onUpdateSavedFilter?.(preset.id, { shared: true });
        }
        const link = buildShareLink(preset);
        setShareContext({ filter: { ...preset, shared: true }, link });
    };

    const handleSaveConfirm = () => {
        if (!onSaveFilter) {
            return;
        }
        const trimmed = saveName.trim();
        if (!trimmed) {
            setSaveError('Name is required.');
            return;
        }
        const result = onSaveFilter({ name: trimmed, shared: saveAsShared });
        if (!result) {
            setSaveError('Unable to save this filter. Try a different name.');
            return;
        }
        setShowSaveModal(false);
        setSaveName('');
        setSaveAsShared(false);
        setSaveError('');
        if (saveAsShared) {
            const link = buildShareLink(result);
            setShareContext({ filter: { ...result, shared: true }, link });
        }
    };

    const handleCopyShareLink = React.useCallback(() => {
        if (!shareContext?.link) {
            return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(shareContext.link)
                .then(() => setCopySuccess(true))
                .catch(() => setCopySuccess(false));
        } else {
            setCopySuccess(false);
        }
    }, [shareContext]);

    React.useEffect(() => {
        if (shareContext) {
            setCopySuccess(false);
        }
    }, [shareContext]);

    // Refs and local visibility state for animated Advanced panel
    const advBtnRef = useRef(null);
    const panelRef = useRef(null);
    const [panelMounted, setPanelMounted] = useState(showAdvanced);
    const [panelVisible, setPanelVisible] = useState(showAdvanced);
    const [transformOrigin, setTransformOrigin] = useState('center top');
    const PANEL_ANIM_MS = 400;

    useEffect(() => {
        let t;
        if (showAdvanced) {
            setPanelMounted(true);
            // compute origin after mount/layout
            requestAnimationFrame(() => {
                const btn = advBtnRef.current;
                const panel = panelRef.current;
                if (btn && panel) {
                    const btnRect = btn.getBoundingClientRect();
                    const panelRect = panel.getBoundingClientRect();
                    const x = btnRect.left + btnRect.width / 2 - panelRect.left;
                    setTransformOrigin(`${Math.max(8, Math.round(x))}px top`);
                }
                // slight delay then show (allow layout)
                t = setTimeout(() => setPanelVisible(true), 20);
            });
        } else {
            setPanelVisible(false);
            // allow exit animation to complete before unmount
            t = setTimeout(() => setPanelMounted(false), PANEL_ANIM_MS + 20);
        }
        return () => clearTimeout(t);
    }, [showAdvanced]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b5b59]" />
                    <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search title, description, or content"
                        className="h-11 rounded-xl border-[#E6E1D7] bg-[#F8F6F2] pl-10 text-[#3d3635]"
                    />
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <Button
                        ref={advBtnRef}
                        variant="outline"
                        className={cn(
                            'h-11 rounded-xl border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]',
                            showAdvanced && 'bg-[#F3F2EC]'
                        )}
                        onClick={() => setShowAdvanced((value) => !value)}
                    >
                        Advanced
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-11 rounded-xl text-[#BA7967] hover:bg-[#F3F2EC]"
                        onClick={onClear}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {panelMounted && (
                <div
                    ref={panelRef}
                    style={{ transformOrigin: transformOrigin }}
                    aria-hidden={!panelVisible}
                    className={cn(
                        'rounded-xl border border-[#BA7967]/40 bg-[#F8F6F2] p-4 text-sm text-[#6b5b59] transform',
                        panelVisible
                            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                            : 'opacity-0 scale-95 translate-y-1 pointer-events-none',
                        `transition-all duration-[${PANEL_ANIM_MS}ms] ease-out`
                    )}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Updated from
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="mt-2 w-full justify-between rounded-lg border-[#BA7967]/40 bg-white text-left font-normal text-[#3d3635] hover:bg-[#F3F2EC]"
                                    >
                                        {fromLabel}
                                        <CalendarIcon className="h-4 w-4 text-[#BA7967]" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <DateRangeCalendar
                                        initialFocus
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={(day) => {
                                            const nextRange = {
                                                ...(filters.dateRange || {}),
                                                from: day ?? undefined,
                                            };
                                            const toCandidate = parseDateValue(nextRange.to);
                                            if (day && toCandidate && day > toCandidate) {
                                                nextRange.to = undefined;
                                            }
                                            update({ dateRange: nextRange });
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Updated to
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="mt-2 w-full justify-between rounded-lg border-[#BA7967]/40 bg-white text-left font-normal text-[#3d3635] hover:bg-[#F3F2EC]"
                                    >
                                        {toLabel}
                                        <CalendarIcon className="h-4 w-4 text-[#BA7967]" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <DateRangeCalendar
                                        initialFocus
                                        mode="single"
                                        selected={toDate}
                                        onSelect={(day) => {
                                            const nextRange = {
                                                ...(filters.dateRange || {}),
                                                to: day ?? undefined,
                                            };
                                            const fromCandidate = parseDateValue(nextRange.from);
                                            if (day && fromCandidate && day < fromCandidate) {
                                                nextRange.from = undefined;
                                            }
                                            update({ dateRange: nextRange });
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Circularity score (%)
                            </label>
                            <div className="mt-3 space-y-3 rounded-lg border border-[#BA7967]/30 bg-white p-4">
                                <Slider
                                    value={circularityRange}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onValueChange={(value) => {
                                        // normalize order so low <= high
                                        const low = Math.min(value[0], value[1]);
                                        const high = Math.max(value[0], value[1]);
                                        update({ circularity: [low, high] });
                                    }}
                                />
                                <div className="flex items-center justify-between text-xs font-medium text-[#3d3635]">
                                    <span>{circularityRange[0]}%</span>
                                    <span>{circularityRange[1]}%</span>
                                </div>
                            </div>
                        </div>

                        <MultiSelectField
                            label="Metals"
                            placeholder="Select metals"
                            options={mergedOptions.metals}
                            selected={filters.metalTypes || []}
                            onToggle={(value) => toggleMultiValue('metalTypes', value)}
                            formatLabel={toTitle}
                        />

                        <MultiSelectField
                            label="Processes"
                            placeholder="Select processes"
                            options={mergedOptions.processes}
                            selected={filters.processes || []}
                            onToggle={(value) => toggleMultiValue('processes', value)}
                            formatLabel={toTitle}
                        />

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Author
                            </label>
                            <Select
                                value={filters.author}
                                onValueChange={(value) => update({ author: value })}
                            >
                                <SelectTrigger className="mt-2 w-full rounded-lg border-[#BA7967]/40 text-left text-[#3d3635]">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {(options.authors || []).map((author) => (
                                        <SelectItem key={author} value={author}>
                                            {author}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Status
                            </label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => update({ status: value })}
                            >
                                <SelectTrigger className="mt-2 w-full rounded-lg border-[#BA7967]/40 text-left text-[#3d3635]">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Tags
                            </label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    value={tagInput}
                                    onChange={(event) => {
                                        setTagInput(event.target.value);
                                    }}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Add tags and press Enter"
                                    className="h-10 rounded-lg border-[#BA7967]/40 bg-white text-[#3d3635]"
                                />
                                <Button
                                    variant="outline"
                                    className="h-10 rounded-lg border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                                    onClick={() => addTag(tagInput)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            {filters.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {filters.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="flex items-center gap-2 border-[#BA7967]/40 bg-white text-[#3d3635]"
                                        >
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="rounded-full p-0.5 text-[#6b5b59] transition-colors hover:text-[#BA7967]"
                                                aria-label={`Remove ${tag}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {availableTagSuggestions.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b5b59]">
                                    <span>Suggestions:</span>
                                    {availableTagSuggestions.slice(0, 6).map((tag) => (
                                        <Badge
                                            key={tag}
                                            asChild
                                            variant="outline"
                                            className="cursor-pointer border-[#BA7967]/40 bg-white text-[#3d3635]"
                                        >
                                            <button type="button" onClick={() => addTag(tag)}>
                                                {toTitle(tag)}
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4 rounded-xl border border-[#BA7967]/30 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">
                                Saved filters
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                                onClick={() => {
                                    setSaveError('');
                                    setSaveAsShared(false);
                                    setSaveName('');
                                    setShowSaveModal(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Save As
                            </Button>
                        </div>

                        {savedFilters.length === 0 ? (
                            <p className="text-xs text-[#6b5b59]">
                                You haven't saved any filter presets yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {savedFilters.map((preset) => (
                                    <div
                                        key={preset.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#BA7967]/20 bg-[#F8F6F2] p-3"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-[#3d3635]">{preset.name}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {preset.shared && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-[#BA7967]/40 bg-white text-[#3d3635]"
                                                    >
                                                        Shared
                                                    </Badge>
                                                )}
                                                {defaultFilterId === preset.id && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-[#BA7967]/60 bg-white text-[#3d3635]"
                                                    >
                                                        Default
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                                                onClick={() => onLoadSavedFilter?.(preset.id)}
                                            >
                                                Load
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-[#3d3635] hover:bg-[#F3F2EC]"
                                                onClick={() => handleShare(preset)}
                                            >
                                                <Share2 className="mr-2 h-4 w-4" />
                                                Share
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={defaultFilterId === preset.id ? 'default' : 'ghost'}
                                                className={cn(
                                                    'text-[#3d3635]',
                                                    defaultFilterId === preset.id
                                                        ? 'bg-[#BA7967] hover:bg-[#a06858]'
                                                        : 'hover:bg-[#F3F2EC]'
                                                )}
                                                onClick={() => onSetDefaultFilter?.(preset.id)}
                                            >
                                                <Star className="mr-2 h-4 w-4" />
                                                {defaultFilterId === preset.id ? 'Default' : 'Set default'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => onDeleteSavedFilter?.(preset.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                Shared filters
                            </label>
                            <Select
                                value={activeSharedFilterId || 'none'}
                                onValueChange={(value) => {
                                    if (value === 'none') {
                                        onClearSharedFilter();
                                        return;
                                    }
                                    onSelectSharedFilter?.(value);
                                }}
                            >
                                <SelectTrigger className="mt-2 w-full rounded-lg border-[#BA7967]/40 text-left text-[#3d3635]">
                                    <SelectValue placeholder="Choose a shared preset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {sharedFilters.map((filter) => (
                                        <SelectItem key={filter.id} value={filter.id}>
                                            {filter.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-[#3d3635]">Save current filters</h3>
                        <p className="mt-2 text-sm text-[#6b5b59]">
                            Give this combination a memorable name so you can reload it later.
                        </p>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wide text-[#6b5b59]">
                                    Name
                                </label>
                                <Input
                                    value={saveName}
                                    onChange={(event) => {
                                        setSaveName(event.target.value);
                                        if (saveError) {
                                            setSaveError('');
                                        }
                                    }}
                                    placeholder="e.g. FY2025 Shared Metals"
                                    className="mt-2"
                                />
                                {saveError && (
                                    <p className="mt-1 text-xs text-red-600">{saveError}</p>
                                )}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[#3d3635]">
                                <Checkbox
                                    checked={saveAsShared}
                                    onCheckedChange={(checked) => setSaveAsShared(Boolean(checked))}
                                />
                                Share immediately after saving
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowSaveModal(false);
                                    setSaveName('');
                                    setSaveError('');
                                    setSaveAsShared(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSaveConfirm}>Save</Button>
                        </div>
                    </div>
                </div>
            )}

            {shareContext && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-[#3d3635]">
                            Share "{shareContext.filter.name}"
                        </h3>
                        <p className="mt-2 text-sm text-[#6b5b59]">
                            Copy the link below and send it to collaborators to load this preset.
                        </p>
                        <div className="mt-4 rounded-lg border border-[#BA7967]/30 bg-[#F8F6F2] p-3 text-xs text-[#3d3635] break-all">
                            {shareContext.link}
                        </div>
                        {copySuccess && (
                            <p className="mt-2 text-xs text-emerald-600">Link copied to clipboard.</p>
                        )}
                        <div className="mt-6 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShareContext(null)}>
                                Close
                            </Button>
                            <Button onClick={handleCopyShareLink}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy link
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiltersPanel;
