'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Shield,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Lock,
  UserX,
  Database,
} from 'lucide-react';
import {
  type PrivacySettings,
  type GDPRComplianceStatus,
  type DataExportRequest,
  type DataDeletionRequest,
  type DataCategory,
  getDataCategoryDisplayName,
  getConsentTypeDisplayName,
} from '@/lib/types/privacy.types';
import { useToast } from '@/hooks/use-toast';

interface PrivacyDashboardProps {
  userId: string;
}

export function PrivacyDashboard({ userId }: PrivacyDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'data' | 'requests'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Privacy data state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<GDPRComplianceStatus | null>(null);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);

  // Form state
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [deletionReason, setDeletionReason] = useState('');

  const { toast } = useToast();

  // Load privacy data
  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, complianceRes, exportRes, deletionRes] = await Promise.all([
        fetch('/api/privacy/settings'),
        fetch('/api/privacy/compliance'),
        fetch('/api/privacy/export-requests'),
        fetch('/api/privacy/deletion-requests'),
      ]);

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setPrivacySettings(settings);
      }

      if (complianceRes.ok) {
        const compliance = await complianceRes.json();
        setComplianceStatus(compliance);
      }

      if (exportRes.ok) {
        const exports = await exportRes.json();
        setExportRequests(exports);
      }

      if (deletionRes.ok) {
        const deletions = await deletionRes.json();
        setDeletionRequests(deletions);
      }
    } catch (error) {
      console.error('Failed to load privacy data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load privacy information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<PrivacySettings>) => {
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setPrivacySettings(updatedSettings);
        toast({
          title: 'Success',
          description: 'Privacy settings updated successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings.',
        variant: 'destructive',
      });
    }
  };

  const handleDataExportRequest = async () => {
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: selectedCategories.length > 0 ? 'specific_categories' : 'full_export',
          dataCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
          format: exportFormat,
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setExportRequests(prev => [newRequest, ...prev]);
        setSelectedCategories([]);
        toast({
          title: 'Success',
          description: 'Data export request submitted. You will be notified when ready.',
        });
      }
    } catch (error) {
      console.error('Failed to request data export:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit data export request.',
        variant: 'destructive',
      });
    }
  };

  const handleDataDeletionRequest = async (deletionType: 'full_account' | 'specific_data') => {
    try {
      const response = await fetch('/api/privacy/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletionType,
          dataCategories: deletionType === 'specific_data' ? selectedCategories : undefined,
          reason: 'user_request',
          reasonDescription: deletionReason,
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setDeletionRequests(prev => [newRequest, ...prev]);
        setSelectedCategories([]);
        setDeletionReason('');
        toast({
          title: 'Success',
          description: 'Data deletion request submitted. There is a 30-day grace period before deletion.',
        });
      }
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit data deletion request.',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryToggle = (category: DataCategory, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy & Data Control</h1>
        <p className="text-gray-600">
          Manage your privacy settings, data exports, and exercise your rights under GDPR and other privacy regulations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Control
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Compliance Status */}
          {complianceStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  GDPR Compliance Status
                </CardTitle>
                <CardDescription>
                  Your current privacy compliance score and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getComplianceColor(complianceStatus.complianceScore)}`}>
                      {complianceStatus.complianceScore}/100
                    </div>
                    <p className="text-sm text-gray-600">Compliance Score</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Valid Consent</span>
                      {complianceStatus.hasValidConsent ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Retention</span>
                      {complianceStatus.dataRetentionCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">No Active Breaches</span>
                      {!complianceStatus.hasUnresolvedBreaches ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Can Export Data</span>
                      {complianceStatus.canExportData ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Can Delete Data</span>
                      {complianceStatus.canDeleteData ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Deletion Request</span>
                      {complianceStatus.hasActiveDeletionRequest ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
              <CardDescription>
                Under GDPR and other privacy laws, you have the following rights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Right to Access</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can request a copy of all personal data we hold about you.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Download className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Right to Portability</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can export your data in a machine-readable format.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">Right to Rectification</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can correct inaccurate or incomplete personal data.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium">Right to Erasure</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can request deletion of your personal data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {privacySettings && (
            <>
              {/* Data Sharing Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Sharing Preferences</CardTitle>
                  <CardDescription>
                    Control how your data is shared and used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Healthcare Provider Sharing</h4>
                      <p className="text-sm text-gray-600">Allow sharing reports with healthcare providers</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowHealthcareSharing}
                      onCheckedChange={(checked) => handleSettingsUpdate({ allowHealthcareSharing: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Anonymous Research</h4>
                      <p className="text-sm text-gray-600">Contribute anonymized data to medical research</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowAnonymizedResearch}
                      onCheckedChange={(checked) => handleSettingsUpdate({ allowAnonymizedResearch: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Analytics & Improvements</h4>
                      <p className="text-sm text-gray-600">Help improve the app with usage analytics</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowAnalytics}
                      onCheckedChange={(checked) => handleSettingsUpdate({ allowAnalytics: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Communications</h4>
                      <p className="text-sm text-gray-600">Receive updates and promotional content</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowMarketing}
                      onCheckedChange={(checked) => handleSettingsUpdate({ allowMarketing: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data Retention */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>
                    Control how long your data is kept
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Data Retention Period</label>
                    <Select
                      value={privacySettings.dataRetentionPeriod}
                      onValueChange={(value) => handleSettingsUpdate({ dataRetentionPeriod: value as any })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_year">1 Year</SelectItem>
                        <SelectItem value="2_years">2 Years</SelectItem>
                        <SelectItem value="5_years">5 Years</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-600 mt-1">
                      How long to keep your health data after your last activity
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-delete Inactive Data</h4>
                      <p className="text-sm text-gray-600">Automatically delete data after retention period</p>
                    </div>
                    <Switch
                      checked={privacySettings.autoDeleteInactiveData}
                      onCheckedChange={(checked) => handleSettingsUpdate({ autoDeleteInactiveData: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Additional security measures for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Require 2FA for sensitive operations</p>
                    </div>
                    <Switch
                      checked={privacySettings.twoFactorRequired}
                      onCheckedChange={(checked) => handleSettingsUpdate({ twoFactorRequired: checked })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Session Timeout (minutes)</label>
                    <Select
                      value={privacySettings.sessionTimeout.toString()}
                      onValueChange={(value) => handleSettingsUpdate({ sessionTimeout: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Select Data Categories</CardTitle>
              <CardDescription>
                Choose which categories of data to export or delete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'personal_identifiers',
                  'health_data',
                  'biometric_data',
                  'behavioral_data',
                  'technical_data',
                  'usage_data',
                  'communication_data',
                  'location_data',
                ].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category as DataCategory)}
                      onCheckedChange={(checked) => handleCategoryToggle(category as DataCategory, checked as boolean)}
                    />
                    <label htmlFor={category} className="text-sm font-medium">
                      {getDataCategoryDisplayName(category as DataCategory)}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Machine Readable)</SelectItem>
                    <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                    <SelectItem value="pdf">PDF (Human Readable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleDataExportRequest} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Request Data Export
              </Button>

              <p className="text-xs text-gray-600">
                Export requests are processed within 30 days. You will receive an email when your export is ready.
              </p>
            </CardContent>
          </Card>

          {/* Data Deletion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Your Data
              </CardTitle>
              <CardDescription>
                Permanently delete your personal data (30-day grace period)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for Deletion (Optional)</label>
                <Textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Please let us know why you're deleting your data..."
                  className="mt-2"
                  maxLength={1000}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDataDeletionRequest('specific_data')}
                  disabled={selectedCategories.length === 0}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected Data
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDataDeletionRequest('full_account')}
                  className="flex-1"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Delete Entire Account
                </Button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>
                      Data deletion is permanent and cannot be undone. There is a 30-day grace period 
                      during which you can cancel the deletion request.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Export Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Data Export Requests</CardTitle>
              <CardDescription>
                Track the status of your data export requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportRequests.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No export requests found.</p>
              ) : (
                <div className="space-y-4">
                  {exportRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="font-medium">{request.requestType.replace('_', ' ')}</span>
                          <Badge variant="outline">{request.format.toUpperCase()}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'completed' && request.exportFileUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={request.exportFileUrl} download>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                        <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deletion Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Data Deletion Requests</CardTitle>
              <CardDescription>
                Track the status of your data deletion requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deletionRequests.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No deletion requests found.</p>
              ) : (
                <div className="space-y-4">
                  {deletionRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <span className="font-medium">{request.deletionType.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          {request.scheduledDeletionAt && (
                            <span className="ml-2">
                              • Scheduled: {new Date(request.scheduledDeletionAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant={request.status === 'completed' ? 'destructive' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}