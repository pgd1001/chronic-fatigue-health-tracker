'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileText,
  Download,
  Share2,
  Calendar as CalendarIcon,
  Eye,
  Trash2,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  type HealthcareReport,
  type GenerateReportRequest,
  type ReportType,
  type ReportPeriod,
  type ConsentLevel,
  type ReportFormat,
  getReportTypeDisplayName,
  getReportPeriodDisplayName,
  getConsentLevelDescription,
} from '@/lib/types/healthcare-report.types';
import { useToast } from '@/hooks/use-toast';

interface HealthcareReportsProps {
  userId: string;
}

export function HealthcareReports({ userId }: HealthcareReportsProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'existing'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingReports, setExistingReports] = useState<HealthcareReport[]>([]);
  
  // Report generation form state
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [consentLevel, setConsentLevel] = useState<ConsentLevel>('basic_metrics');
  const [customTitle, setCustomTitle] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [includeRawData, setIncludeRawData] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const { toast } = useToast();

  // Load existing reports
  useEffect(() => {
    loadExistingReports();
  }, [userId]);

  const loadExistingReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const reports = await response.json();
        setExistingReports(reports);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load existing reports.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const request: GenerateReportRequest = {
        reportType,
        reportPeriod,
        consentLevel,
        includeRawData,
        customTitle: customTitle.trim() || undefined,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas as any : undefined,
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const newReport = await response.json();
        setExistingReports(prev => [newReport, ...prev]);
        setActiveTab('existing');
        
        toast({
          title: 'Success',
          description: 'Healthcare report generated successfully.',
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (report: HealthcareReport, format: ReportFormat) => {
    try {
      const response = await fetch(`/api/reports/${report.id}/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.reportTitle.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: `Report downloaded as ${format.toUpperCase()}.`,
        });
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExistingReports(prev => prev.filter(r => r.id !== reportId));
        toast({
          title: 'Success',
          description: 'Report deleted successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete report.',
        variant: 'destructive',
      });
    }
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFocusAreas(prev => [...prev, area]);
    } else {
      setFocusAreas(prev => prev.filter(a => a !== area));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Healthcare Provider Reports</h1>
        <p className="text-gray-600">
          Generate comprehensive health reports to share with your healthcare providers. 
          All reports are generated with your consent and privacy controls.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generate' | 'existing')}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate New Report
          </TabsTrigger>
          <TabsTrigger value="existing" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Existing Reports ({existingReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Report Configuration
              </CardTitle>
              <CardDescription>
                Configure the type and scope of your healthcare report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                    <SelectItem value="symptom_focused">Symptom-Focused</SelectItem>
                    <SelectItem value="activity_focused">Activity & Movement</SelectItem>
                    <SelectItem value="biometric_focused">Biometric Analysis</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {getReportTypeDisplayName(reportType)} - Choose the focus of your report
                </p>
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={reportPeriod} onValueChange={(value) => setReportPeriod(value as ReportPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                    <SelectItem value="quarter">Past 3 Months</SelectItem>
                    <SelectItem value="six_months">Past 6 Months</SelectItem>
                    <SelectItem value="year">Past Year</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {reportPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date > new Date() || (startDate && date < startDate)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Custom Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Title (Optional)</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Pre-Appointment Health Summary"
                  maxLength={200}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Privacy & Consent
              </CardTitle>
              <CardDescription>
                Control what information is included in your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consent Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Sharing Level</label>
                <Select value={consentLevel} onValueChange={(value) => setConsentLevel(value as ConsentLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic_metrics">Basic Metrics Only</SelectItem>
                    <SelectItem value="detailed_symptoms">Include Detailed Symptoms</SelectItem>
                    <SelectItem value="full_data">Full Health Data</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  {getConsentLevelDescription(consentLevel)}
                </p>
              </div>

              {/* Focus Areas */}
              {consentLevel === 'custom' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Focus Areas</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'symptoms', label: 'Symptoms & Pain' },
                      { id: 'activity', label: 'Activity & Movement' },
                      { id: 'sleep', label: 'Sleep Patterns' },
                      { id: 'biometrics', label: 'Biometric Data' },
                      { id: 'pacing', label: 'Pacing & Energy' },
                      { id: 'nutrition', label: 'Nutrition & Hydration' },
                    ].map((area) => (
                      <div key={area.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={area.id}
                          checked={focusAreas.includes(area.id)}
                          onCheckedChange={(checked) => handleFocusAreaChange(area.id, checked as boolean)}
                        />
                        <label htmlFor={area.id} className="text-sm">{area.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRawData"
                    checked={includeRawData}
                    onCheckedChange={(checked) => setIncludeRawData(checked as boolean)}
                  />
                  <label htmlFor="includeRawData" className="text-sm">
                    Include raw data for detailed analysis
                  </label>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Privacy Protection</p>
                    <p>
                      Your report will be anonymized with a patient ID. No personally identifiable 
                      information will be included unless you explicitly choose to add it.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="existing" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </CardContent>
            </Card>
          ) : existingReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                <p className="text-gray-600 max-w-md">
                  You haven't generated any healthcare reports yet. Create your first report to share with your healthcare provider.
                </p>
                <Button
                  onClick={() => setActiveTab('generate')}
                  className="mt-4"
                >
                  Generate First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {existingReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.reportTitle}</CardTitle>
                        <CardDescription>
                          {getReportTypeDisplayName(report.reportType)} • 
                          {format(new Date(report.startDate), 'MMM d')} - {format(new Date(report.endDate), 'MMM d, yyyy')} •
                          Generated {format(report.generatedAt, 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          Quality: {report.dataQualityScore}/100
                        </Badge>
                        {report.sharedWithProvider && (
                          <Badge variant="secondary">
                            <Share2 className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Executive Summary Preview */}
                      <div>
                        <h4 className="font-medium mb-2">Executive Summary</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {report.executiveSummary}
                        </p>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.healthMetrics.averageFatigueLevel && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold">{report.healthMetrics.averageFatigueLevel}/10</div>
                            <div className="text-xs text-gray-600">Avg Fatigue</div>
                          </div>
                        )}
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold">{report.healthMetrics.goodDays}</div>
                          <div className="text-xs text-gray-600">Good Days</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold">{report.symptomAnalysis.topSymptoms.length}</div>
                          <div className="text-xs text-gray-600">Top Symptoms</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold">{report.healthMetrics.totalDaysTracked}</div>
                          <div className="text-xs text-gray-600">Days Tracked</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(report, 'pdf')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(report, 'json')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(report, 'csv')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}