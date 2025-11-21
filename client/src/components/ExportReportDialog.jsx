import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Upload,
  Loader2,
  CheckCircle2 
} from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

const ExportReportDialog = ({ open, onOpenChange, report }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedTemplate, setSelectedTemplate] = useState('pro');
  const [selectedSections, setSelectedSections] = useState({
    keyMetrics: true,
    findings: true,
    methodology: false,
    appendices: false,
  });
  const [brandLabel, setBrandLabel] = useState('Hashim Ansari');
  const [logoFile, setLogoFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isExporting, setIsExporting] = useState(false);
  
  // Store report data locally when dialog opens to prevent it from becoming null
  const [cachedReport, setCachedReport] = useState(null);

  // Cache the report when dialog opens
  useEffect(() => {
    if (open && report) {
      console.log('📦 Caching report:', report);
      setCachedReport(report);
    }
  }, [open, report]);

  // Debug logging
  useEffect(() => {
    console.log('ExportReportDialog rendered with report:', report);
    console.log('Cached report:', cachedReport);
    console.log('Report ID:', report?._id || report?.id);
    console.log('Dialog open:', open);
  }, [report, cachedReport, open]);

  const formats = [
    {
      id: 'pdf',
      icon: FileText,
      label: 'PDF',
      description: 'Formatted, ready-to-share document',
    },
    {
      id: 'excel',
      icon: FileSpreadsheet,
      label: 'Excel',
      description: 'Spreadsheet with raw tables',
    },
    {
      id: 'data-bundle',
      icon: Database,
      label: 'Data Bundle',
      description: 'Excel and data in JSON',
    },
  ];

  const templates = [
    { id: 'pro', label: 'Pro template (charts & cover)' },
  ];

  const sections = [
    { id: 'keyMetrics', label: 'Key metrics dashboard' },
    { id: 'findings', label: 'Findings & executive summary' },
    { id: 'methodology', label: 'Methodology & assumptions' },
    { id: 'appendices', label: 'Appendices & raw attachments' },
  ];

  const handleSectionToggle = (sectionId) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleExport = async () => {
    // Use cached report to prevent null reference errors
    const activeReport = cachedReport || report;
    
    console.log('=== EXPORT BUTTON CLICKED ===');
    console.log('Full report object:', activeReport);
    console.log('Report _id:', activeReport?._id);
    console.log('Report id:', activeReport?.id);
    console.log('All report keys:', activeReport ? Object.keys(activeReport) : 'report is null/undefined');
    
    // Try both _id and id fields (MongoDB uses _id, but frontend might use id)
    const reportId = activeReport?._id || activeReport?.id;
    
    if (!reportId) {
      console.error('❌ No report ID found!');
      console.error('Report object:', activeReport);
      console.error('Original report:', report);
      console.error('Cached report:', cachedReport);
      alert(`Error: Unable to find report ID. Report object: ${JSON.stringify(activeReport)}`);
      return;
    }

    console.log('✅ Using report ID:', reportId);
    setIsExporting(true);
    try {
      let response;
      
      if (selectedFormat === 'pdf') {
        const url = `/export/reports/${reportId}/pdf`;
        console.log('📡 Making PDF export request to:', url);
        console.log('📡 Full URL will be:', `${import.meta.env.VITE_API_URL}${url}`);
        
        response = await api.post(
          url,
          {
            template: selectedTemplate,
            includeCharts: true,
            sections: selectedSections,
            branding: {
              label: brandLabel,
              logo: logoFile
            }
          },
          {
            responseType: 'blob',
          }
        );
        
        console.log('✅ PDF export response received');
        
        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${activeReport.title || activeReport.name || 'LCA-Report'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
      } else if (selectedFormat === 'data-bundle') {
        const url = `/export/reports/${reportId}/json?pretty=true`;
        console.log('📡 Making JSON export request to:', url);
        console.log('📡 Full URL will be:', `${import.meta.env.VITE_API_URL}${url}`);
        
        // JSON export
        response = await api.get(
          url,
          {
            responseType: 'blob',
          }
        );
        
        console.log('✅ JSON export response received');
        
        const blob = new Blob([response.data], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${activeReport.title || activeReport.name || 'LCA-Report'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
      
      console.log('✅ Export successful!');
      // Close dialog on success
      onOpenChange(false);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to export report: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatObj = formats.find(f => f.id === selectedFormat);
  const sectionsCount = Object.values(selectedSections).filter(Boolean).length;
  
  // Use cached report for display
  const activeReport = cachedReport || report;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {activeReport?.title || activeReport?.name || 'LCA Report'}
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure export format, content sections, and branding before generating the file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6 overflow-y-auto flex-1">
          {/* Format Selection */}
          <div className="grid grid-cols-3 gap-3">
            {formats.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-[#BA7967] bg-[#FFF8F6]'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon 
                    className={cn(
                      'w-8 h-8',
                      isSelected ? 'text-[#BA7967]' : 'text-gray-600'
                    )} 
                  />
                  <div className="text-center">
                    <div className={cn(
                      'font-semibold text-sm',
                      isSelected ? 'text-[#BA7967]' : 'text-gray-900'
                    )}>
                      {format.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedFormat === 'pdf' && (
            <>
              {/* Template Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">TEMPLATE</Label>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                        selectedTemplate === template.id
                          ? 'border-[#BA7967] bg-[#FFF8F6]'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="text-sm">{template.label}</span>
                      {selectedTemplate === template.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#BA7967]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">SECTIONS</Label>
                  <span className="text-xs text-gray-500">
                    {sectionsCount} section{sectionsCount !== 1 ? 's' : ''} will be included in the export.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                        selectedSections[section.id]
                          ? 'border-[#BA7967]/30 bg-[#FFF8F6]'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => handleSectionToggle(section.id)}
                    >
                      <Checkbox
                        checked={selectedSections[section.id]}
                        onCheckedChange={() => handleSectionToggle(section.id)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{section.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">BRANDING</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">BRAND LABEL</Label>
                    <input
                      type="text"
                      value={brandLabel}
                      onChange={(e) => setBrandLabel(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">LOGO ASSET</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-500 truncate"
                      >
                        {logoFile ? logoFile.name : 'Choose file No fi...osen'}
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">LANGUAGE</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967] focus:border-transparent"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="es">Spanish (ES)</option>
                </select>
                <p className="text-xs text-gray-500">
                  Localized strings are mocked for now; content exports remain in English until i18n lands.
                </p>
              </div>
            </>
          )}

          {/* Report Snapshot */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">REPORT SNAPSHOT</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{activeReport?.status || activeReport?.category || 'final'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">CIRCULARITY SCORE</span>
                <span className="font-medium">{activeReport?.circularityScore ? `${activeReport.circularityScore}%` : '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">ENERGY DEMAND</span>
                <span className="font-medium">{activeReport?.energyDemand || activeReport?.energyConsumption || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">WATER CONSUMPTION</span>
                <span className="font-medium">{activeReport?.waterUsage || activeReport?.waterConsumption || '—'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Charts, diagrams, and calculations will be embedded for PDF exports. Excel and data bundles include raw tables and JSON payloads.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#BA7967] hover:bg-[#A86957] text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate & Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReportDialog;
