import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    FileDown,
    FileSpreadsheet,
    Loader2,
    Package,
    Upload,
    X,
} from 'lucide-react';

const FORMAT_TABS = [
    { key: 'pdf', label: 'PDF', description: 'Formatted, ready-to-share document', icon: FileDown },
    { key: 'excel', label: 'Excel', description: 'Structured workbook with metrics & raw data', icon: FileSpreadsheet },
    { key: 'bundle', label: 'Data Bundle', description: 'ZIP archive with JSON datasets & charts', icon: Package },
];

const SECTION_LABELS = {
    metrics: 'Key metrics dashboard',
    findings: 'Findings & executive summary',
    methodology: 'Methodology & assumptions',
    attachments: 'Appendices & raw attachments',
};

const createDefaultSections = () => ({
    metrics: true,
    findings: true,
    methodology: false,
    attachments: false,
});

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English (EN)' },
    { value: 'fr', label: 'Français (FR)' },
];

const SUCCESS_MESSAGES = {
    pdf: 'PDF export complete. A download will start shortly.',
    excel: 'Excel workbook generated. Check your downloads.',
    bundle: 'ZIP bundle assembled with selected content.',
};

const formatMetric = (value, suffix = '') => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return suffix ? `${value.toLocaleString('en-IN')} ${suffix}` : value.toLocaleString('en-IN');
    }
    return '—';
};

const ExportModal = ({ open, onClose, report, initialFormat = 'pdf' }) => {
    const [activeFormat, setActiveFormat] = useState(initialFormat);
    const [template, setTemplate] = useState('pro');
    const [sections, setSections] = useState(() => createDefaultSections());
    const [brandingName, setBrandingName] = useState('');
    const [brandingLogo, setBrandingLogo] = useState(null);
    const [language, setLanguage] = useState('en');
    const [isExporting, setIsExporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open) {
            return;
        }
        const validFormat = FORMAT_TABS.some((tab) => tab.key === initialFormat)
            ? initialFormat
            : 'pdf';
        setActiveFormat(validFormat);
        setTemplate('pro');
        setSections(createDefaultSections());
        setBrandingName(report?.generatedBy || '');
        setBrandingLogo(null);
        setLanguage('en');
        setStatusMessage('');
        setErrorMessage('');
        setIsExporting(false);
    }, [open, initialFormat, report]);

    const activeFormatConfig = useMemo(
        () => FORMAT_TABS.find((tab) => tab.key === activeFormat) || FORMAT_TABS[0],
        [activeFormat]
    );

    const handleToggleSection = (key) => {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const loadRuntimeModule = async (url) => {
        try {
            const module = await import(/* @vite-ignore */ url);
            return module;
        } catch (runtimeError) {
            console.warn('[export] Unable to load optional module', url, runtimeError);
            return null;
        }
    };

    const simulateExportWork = () =>
        new Promise((resolve) => {
            setTimeout(resolve, 1200);
        });

    const handleExport = async () => {
        if (!report) {
            return;
        }
        setIsExporting(true);
        setErrorMessage('');
        setStatusMessage('Preparing export...');

        const payload = {
            reportId: report.id,
            reportName: report.name,
            format: activeFormat,
            template,
            sections: Object.keys(sections).filter((key) => sections[key]),
            branding: {
                name: brandingName.trim() || null,
                logoName: brandingLogo?.name || null,
            },
            language,
        };

        try {
            if (activeFormat === 'pdf') {
                await loadRuntimeModule('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.js');
            }
            if (activeFormat === 'excel') {
                await loadRuntimeModule('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
            }
            if (activeFormat === 'bundle') {
                await loadRuntimeModule('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
            }

            console.info('[export] Starting export', payload);
            await simulateExportWork();
            setStatusMessage(SUCCESS_MESSAGES[activeFormat] || 'Export complete.');
            setTimeout(() => {
                onClose?.();
            }, 600);
        } catch (error) {
            console.error('[export] Export failed', error);
            setErrorMessage('Failed to generate the export. Please try again.');
            setStatusMessage('');
        } finally {
            setIsExporting(false);
        }
    };

    if (!open || !report) {
        return null;
    }

    const selectedSections = Object.keys(sections).filter((key) => sections[key]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full p-2 text-[#6b5b59] transition-colors hover:bg-[#BA7967] hover:text-[#3d3635]"
                    onClick={onClose}
                    aria-label="Close export modal"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#BA7967]">
                            Export report
                        </p>
                        <h2 className="text-2xl font-semibold text-[#181814]">{report.name}</h2>
                        <p className="text-sm text-[#6b5b59]">
                            Configure export format, content sections, and branding before generating the file.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {FORMAT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Button
                                    key={tab.key}
                                    type="button"
                                    variant={activeFormat === tab.key ? 'default' : 'outline'}
                                    className={cn(
                                        'flex items-center gap-2 border-[#BA7967]/40 text-sm',
                                        activeFormat === tab.key
                                            ? 'bg-[#BA7967] text-white hover:bg-[#3d3635]'
                                            : 'text-[#3d3635] hover:bg-[#BA7967]'
                                    )}
                                    onClick={() => setActiveFormat(tab.key)}
                                    disabled={isExporting}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </Button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-[#6b5b59]">{activeFormatConfig.description}</p>

                    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="template-select" className="text-xs uppercase tracking-wide text-[#6b5b59]">
                                    Template
                                </Label>
                                <Select value={template} onValueChange={setTemplate}>
                                    <SelectTrigger id="template-select" className="border-[#BA7967]/40 text-[#3d3635]">
                                        <SelectValue placeholder="Choose template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pro">Pro template (charts & cover)</SelectItem>
                                        <SelectItem value="basic">Basic template (lean layout)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Sections</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(SECTION_LABELS).map(([key, labelText]) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 rounded-lg border border-[#BA7967]/30 bg-[#F8F6F2] p-3 text-sm text-[#3d3635]"
                                        >
                                            <Checkbox
                                                checked={sections[key]}
                                                onCheckedChange={() => handleToggleSection(key)}
                                                disabled={isExporting}
                                            />
                                            {labelText}
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-[#6b5b59]">
                                    {selectedSections.length} section{selectedSections.length === 1 ? '' : 's'} will be included in the export.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Branding</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="branding-name" className="text-xs uppercase tracking-wide text-[#6b5b59]">
                                            Brand label
                                        </Label>
                                        <Input
                                            id="branding-name"
                                            value={brandingName}
                                            onChange={(event) => setBrandingName(event.target.value)}
                                            placeholder="e.g. Aether Metals"
                                            disabled={isExporting}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branding-logo" className="text-xs uppercase tracking-wide text-[#6b5b59]">
                                            Logo asset
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="branding-logo"
                                                type="file"
                                                accept="image/png,image/jpeg,image/svg+xml"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] || null;
                                                    setBrandingLogo(file);
                                                }}
                                                disabled={isExporting}
                                            />
                                            <Upload className="h-4 w-4 text-[#BA7967]" />
                                        </div>
                                        {brandingLogo && (
                                            <p className="text-xs text-[#6b5b59]">Selected: {brandingLogo.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="language-select" className="text-xs uppercase tracking-wide text-[#6b5b59]">
                                    Language
                                </Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger id="language-select" className="border-[#BA7967]/40 text-[#3d3635]">
                                        <SelectValue placeholder="Choose language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-[#6b5b59]">
                                    Localized strings are mocked for now; content exports remain in English until i18n lands.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 rounded-2xl border border-[#E6E1D7] bg-[#F8F6F2] p-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5b59]">Report snapshot</p>
                                <p className="text-sm font-medium text-[#3d3635]">{report.category || '—'}</p>
                                <p className="text-xs text-[#6b5b59]">Status: {report.status || 'Unknown'}</p>
                            </div>
                            <div className="space-y-2 text-sm text-[#3d3635]">
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs uppercase text-[#6b5b59]">Circularity score</p>
                                    <p className="text-lg font-semibold text-[#181814]">
                                        {formatMetric(report.summary?.circularityScore, '%')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs uppercase text-[#6b5b59]">Energy demand</p>
                                    <p className="text-lg font-semibold text-[#181814]">
                                        {formatMetric(report.summary?.energyDemand, 'kWh/t')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white p-3 shadow-sm">
                                    <p className="text-xs uppercase text-[#6b5b59]">Water consumption</p>
                                    <p className="text-lg font-semibold text-[#181814]">
                                        {formatMetric(report.summary?.waterConsumption, 'm³')}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-dashed border-[#BA7967]/30 p-3 text-xs text-[#6b5b59]">
                                Charts, diagrams, and calculations will be embedded for PDF exports. Excel and data bundles include raw tables and JSON payloads.
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1 text-xs">
                            {statusMessage && <p className="text-emerald-600">{statusMessage}</p>}
                            {errorMessage && <p className="text-red-600">{errorMessage}</p>}
                            {!statusMessage && !errorMessage && (
                                <p className="text-[#6b5b59]">
                                    Exports may take up to 10 seconds while charts and attachments are composed.
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-[#3d3635] hover:bg-[#BA7967]"
                                onClick={onClose}
                                disabled={isExporting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-[#BA7967] text-white hover:bg-[#3d3635]"
                                onClick={handleExport}
                                disabled={isExporting || selectedSections.length === 0}
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                        Export {activeFormatConfig.label}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
