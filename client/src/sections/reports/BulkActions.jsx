import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, FileDown, FileSpreadsheet, Loader2, SquareCheck, SquareX } from 'lucide-react';

const BulkActions = ({
    selectedCount,
    totalCount,
    onSelectAll,
    onClearSelection,
    onBulkExport,
    activeJob,
}) => {
    const hasSelection = selectedCount > 0;
    const allSelected = hasSelection && selectedCount === totalCount && totalCount > 0;
    const disableExports = !hasSelection;
    const isJobRunning = Boolean(activeJob && activeJob.status === 'running');

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#BA7967]/40 bg-[#F3F2EC] p-4 text-sm text-[#3d3635] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <SquareCheck className="h-4 w-4 text-[#BA7967]" />
                    {selectedCount} report{selectedCount === 1 ? '' : 's'} selected
                </div>
                <p className="text-xs text-[#6b5b59]">
                    {allSelected ? 'All filtered reports are selected.' : `Selecting affects exports and bulk actions.`}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="border border-transparent text-[#3d3635] hover:bg-[#F3F2EC]"
                    onClick={onSelectAll}
                    disabled={allSelected || totalCount === 0}
                >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Select all
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="border border-transparent text-[#3d3635] hover:bg-[#F3F2EC]"
                    onClick={onClearSelection}
                    disabled={!hasSelection}
                >
                    <SquareX className="mr-1.5 h-4 w-4" />
                    Clear
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="bg-[#BA7967] text-white hover:bg-[#3d3635]"
                    onClick={() => onBulkExport?.('pdf-bundle')}
                    disabled={disableExports}
                >
                    <FileDown className="mr-1.5 h-4 w-4" />
                    PDF bundle
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#BA7967]/40 text-[#3d3635] hover:bg-[#F3F2EC]"
                    onClick={() => onBulkExport?.('excel-multi')}
                    disabled={disableExports}
                >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                    Excel workbook
                </Button>
            </div>

            {activeJob && (
                <div className="flex flex-1 flex-col gap-2 rounded-xl border border-dashed border-[#BA7967]/30 bg-white p-3 text-xs text-[#6b5b59] sm:max-w-sm sm:self-stretch">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#3d3635]">{activeJob.label}</span>
                        <span className="text-[#6b5b59]">{Math.round(activeJob.progress)}%</span>
                    </div>
                    <Progress value={activeJob.progress} className="h-2" />
                    <div className="flex items-center gap-2 text-xs">
                        {isJobRunning ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#BA7967]" />
                                <span>Processing in background…</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Export ready to download.</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkActions;
