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
import { Sparkles, CheckCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Modal component to display reasoning for generated fallback values
 * Shows which fields were populated, the matched scenarios, and explanations
 */
export default function FallbackReasoningModal({ 
  isOpen, 
  onClose, 
  reasoning = {},
  matchedScenarios = [],
  populatedCount = 0,
  stepName = ''
}) {
  if (!isOpen) return null;

  const hasContent = Object.keys(reasoning).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-[#BA7967]" />
            Fallback Values Generated for {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Successfully populated <span className="font-semibold text-[#BA7967]">{populatedCount}</span> missing {populatedCount === 1 ? 'field' : 'fields'} based on realistic scenarios and dependency rules.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4 my-4">
          {/* Matched Scenarios Section */}
          {matchedScenarios && matchedScenarios.length > 0 && (
            <div className="rounded-lg border border-[#e3d4c8] bg-linear-to-br from-blue-50 to-indigo-50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                Matched Scenarios
              </h3>
              <div className="space-y-2">
                {matchedScenarios.map((scenario, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-blue-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {scenario.key}
                      </span>
                      <span className="text-sm text-gray-700">{scenario.name}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      Score: {scenario.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Populated Fields Section */}
          {hasContent && (
            <div className="rounded-lg border border-[#e3d4c8] bg-white">
              <div className="bg-linear-to-r from-[#BA7967] to-[#a86b5c] text-white px-4 py-3 rounded-t-lg">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Generated Values & Reasoning
                </h3>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto p-4">
                <div className="space-y-3">
                  {Object.entries(reasoning).map(([fieldName, data], index) => (
                    <div
                      key={fieldName}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#BA7967] transition-colors bg-linear-to-br from-gray-50 to-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              #{index + 1}
                            </span>
                            <code className="text-sm font-mono bg-[#BA7967]/10 text-[#BA7967] px-2 py-0.5 rounded border border-[#BA7967]/30">
                              {fieldName}
                            </code>
                          </div>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-xs text-gray-500">Value:</span>
                            <span className="text-lg font-bold text-gray-800">
                              {typeof data.value === 'number' 
                                ? data.value.toFixed(2)
                                : data.value}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Base Scenario */}
                      {data.baseScenario && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <span className="font-semibold">📊 Base:</span> {data.baseScenario}
                          </p>
                        </div>
                      )}

                      {/* Reasoning */}
                      {data.reasons && data.reasons.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Reasoning:
                          </p>
                          {data.reasons.map((reason, idx) => (
                            <div 
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-700"
                            >
                              <span className="text-[#BA7967] mt-0.5">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!hasContent && (
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-gray-600">No fallback values were generated.</p>
              <p className="text-sm text-gray-500 mt-2">
                All fields are either filled by you or predicted by AI.
              </p>
            </div>
          )}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 mt-4">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#BA7967] hover:bg-[#a86b5c]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
