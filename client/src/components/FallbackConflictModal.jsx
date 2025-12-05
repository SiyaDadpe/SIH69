import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

/**
 * Modal component to display conflicts detected during fallback generation
 * Shows warnings about conflicting user inputs and asks for confirmation
 */
export default function FallbackConflictModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  conflicts = [],
  stepName = ''
}) {
  if (!isOpen || conflicts.length === 0) return null;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBorderColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const hasErrors = conflicts.some(c => c.severity === 'error');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Conflicts Detected in {stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step
          </DialogTitle>
          <DialogDescription>
            We found {conflicts.length} potential {conflicts.length === 1 ? 'issue' : 'issues'} with your current inputs.
            Please review them before proceeding with fallback generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className={`rounded-lg border-2 p-4 ${getSeverityBorderColor(conflict.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {getSeverityIcon(conflict.severity)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                      {conflict.severity}
                    </span>
                    {conflict.field && (
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-300">
                        {conflict.field}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {conflict.message}
                  </p>
                  {conflict.suggestion && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-300">
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">💡 Suggestion:</span> {conflict.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onProceed}
            className="w-full sm:w-auto bg-[#BA7967] hover:bg-[#a86b5c]"
            disabled={hasErrors}
          >
            {hasErrors 
              ? 'Fix Errors First' 
              : 'Proceed Anyway'}
          </Button>
        </DialogFooter>

        {hasErrors && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              <span className="font-semibold">⚠️ Critical errors detected:</span> Please fix the error-level issues before proceeding with fallback generation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
