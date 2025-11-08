import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import api from '@/services/api';

const ExportDialog = ({ open, onOpenChange, reportId, reportTitle }) => {
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    template: 'standard',
    includeCharts: true,
    includeRawData: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF',
      icon: FileText,
      description: 'Best for sharing and printing',
      templates: ['standard', 'executive', 'technical'],
    },
    {
      value: 'excel',
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Best for data analysis',
      templates: null,
    },
    {
      value: 'json',
      label: 'JSON',
      icon: FileJson,
      description: 'Best for data portability',
      templates: null,
    },
  ];

  const templateLabels = {
    standard: 'Standard Report',
    executive: 'Executive Summary',
    technical: 'Technical Detail',
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let response;
      
      if (format === 'pdf') {
        response = await api.post(
          `/api/export/reports/${reportId}/pdf`,
          {
            template: options.template,
            includeCharts: options.includeCharts,
          },
          {
            responseType: 'blob',
          }
        );
        
        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle || 'report'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
      } else if (format === 'excel') {
        response = await api.post(
          `/api/export/reports/${reportId}/excel`,
          {
            includeRawData: options.includeRawData,
          },
          {
            responseType: 'blob',
          }
        );
        
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle || 'report'}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
      } else if (format === 'json') {
        response = await api.get(`/api/export/reports/${reportId}/json?pretty=true`, {
          responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle || 'report'}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      // Close dialog on success
      onOpenChange(false);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatOption = formatOptions.find(f => f.value === format);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Choose your preferred export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Template Selection (PDF only) */}
          {format === 'pdf' && (
            <div className="space-y-3">
              <Label>Template</Label>
              <RadioGroup
                value={options.template}
                onValueChange={(value) =>
                  setOptions({ ...options, template: value })
                }
              >
                {selectedFormatOption.templates.map((template) => (
                  <div key={template} className="flex items-center space-x-3">
                    <RadioGroupItem value={template} id={template} />
                    <label htmlFor={template} className="cursor-pointer">
                      {templateLabels[template]}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            
            {format === 'pdf' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeCharts: checked })
                  }
                />
                <label
                  htmlFor="includeCharts"
                  className="text-sm cursor-pointer"
                >
                  Include charts and visualizations
                </label>
              </div>
            )}

            {format === 'excel' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRawData"
                  checked={options.includeRawData}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeRawData: checked })
                  }
                />
                <label
                  htmlFor="includeRawData"
                  className="text-sm cursor-pointer"
                >
                  Include raw data sheet
                </label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormatOption?.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
