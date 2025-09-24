import { z } from 'zod';

// Consent types
export const ConsentTypeSchema = z.enum([
  'essential',
  'functional',
  'analytics',
  'marketing',
  'healthcare_sharing',
  'research_participation',
  'data_processing',
  'third_party_integrations'
]);

// Consent status
export const ConsentStatusSchema = z.enum([
  'granted',
  'denied',
  'withdrawn',
  'pending',
  'expired'
]);

// Data processing purposes
export const ProcessingPurposeSchema = z.enum([
  'service_provision',
  'health_tracking',
  'analytics_improvement',
  'healthcare_reporting',
  'research_anonymized',
  'legal_compliance',
  'security_monitoring',
  'customer_support'
]);

// Data categories
export const DataCategorySchema = z.enum([
  'personal_identifiers',
  'health_data',
  'biometric_data',
  'behavioral_data',
  'technical_data',
  'usage_data',
  'communication_data',
  'location_data'
]);

// Legal basis for processing
export const LegalBasisSchema = z.enum([
  'consent',
  'contract',
  'legal_obligation',
  'vital_interests',
  'public_task',
  'legitimate_interests'
]);

// User consent record
export const UserConsentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  consentType: ConsentTypeSchema,
  status: ConsentStatusSchema,
  legalBasis: LegalBasisSchema,
  processingPurposes: z.array(ProcessingPurposeSchema),
  dataCategories: z.array(DataCategorySchema),
  
  // Consent details
  consentText: z.string().max(2000),
  consentVersion: z.string().max(50),
  consentLanguage: z.string().length(2), // ISO 639-1 language code
  
  // Timestamps
  grantedAt: z.date().optional(),
  withdrawnAt: z.date().optional(),
  expiresAt: z.date().optional(),
  lastUpdatedAt: z.date(),
  
  // Audit trail
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  consentMethod: z.enum(['explicit_click', 'form_submission', 'api_call', 'import']),
  
  // Metadata
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Data export request
export const DataExportRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Request details
  requestType: z.enum(['full_export', 'partial_export', 'specific_categories']),
  dataCategories: z.array(DataCategorySchema).optional(),
  dateRange: z.object({
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  }).optional(),
  
  // Export format
  format: z.enum(['json', 'csv', 'pdf', 'xml']),
  includeMetadata: z.boolean().default(true),
  anonymizeData: z.boolean().default(false),
  
  // Status tracking
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'expired']),
  requestedAt: z.date(),
  processedAt: z.date().optional(),
  completedAt: z.date().optional(),
  expiresAt: z.date(),
  
  // File details
  exportFileUrl: z.string().url().optional(),
  exportFileSize: z.number().int().positive().optional(),
  exportFileHash: z.string().optional(),
  
  // Audit
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Data deletion request (Right to Erasure)
export const DataDeletionRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Deletion details
  deletionType: z.enum(['full_account', 'specific_data', 'retention_period_expired']),
  dataCategories: z.array(DataCategorySchema).optional(),
  reason: z.enum([
    'withdrawal_of_consent',
    'no_longer_necessary',
    'unlawful_processing',
    'compliance_obligation',
    'user_request'
  ]),
  reasonDescription: z.string().max(1000).optional(),
  
  // Retention considerations
  retentionOverride: z.boolean().default(false),
  retentionReason: z.string().max(500).optional(),
  legalBasisForRetention: LegalBasisSchema.optional(),
  
  // Status and timing
  status: z.enum(['pending', 'approved', 'processing', 'completed', 'rejected']),
  requestedAt: z.date(),
  approvedAt: z.date().optional(),
  scheduledDeletionAt: z.date().optional(), // 30-day grace period
  completedAt: z.date().optional(),
  
  // Audit trail
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  approvedBy: z.string().uuid().optional(), // Admin user ID
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Privacy settings
export const PrivacySettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Data sharing preferences
  allowHealthcareSharing: z.boolean().default(false),
  allowAnonymizedResearch: z.boolean().default(false),
  allowAnalytics: z.boolean().default(true),
  allowMarketing: z.boolean().default(false),
  
  // Data retention preferences
  dataRetentionPeriod: z.enum(['1_year', '2_years', '5_years', 'indefinite']).default('2_years'),
  autoDeleteInactiveData: z.boolean().default(true),
  
  // Communication preferences
  privacyNotifications: z.boolean().default(true),
  dataBreachNotifications: z.boolean().default(true),
  policyUpdateNotifications: z.boolean().default(true),
  
  // Access controls
  twoFactorRequired: z.boolean().default(false),
  sessionTimeout: z.number().int().min(15).max(480).default(60), // minutes
  
  // Data portability
  allowDataExport: z.boolean().default(true),
  exportNotifications: z.boolean().default(true),
  
  updatedAt: z.date(),
  createdAt: z.date(),
});

// Data breach incident
export const DataBreachIncidentSchema = z.object({
  id: z.string().uuid(),
  
  // Incident details
  incidentType: z.enum([
    'unauthorized_access',
    'data_loss',
    'system_compromise',
    'human_error',
    'third_party_breach',
    'malicious_attack'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  
  // Affected data
  affectedDataCategories: z.array(DataCategorySchema),
  affectedUserCount: z.number().int().min(0),
  affectedUsers: z.array(z.string().uuid()).optional(),
  
  // Incident timeline
  discoveredAt: z.date(),
  occurredAt: z.date().optional(),
  containedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  
  // Response details
  description: z.string().max(2000),
  impactAssessment: z.string().max(1000),
  mitigationActions: z.array(z.string().max(500)),
  
  // Notifications
  usersNotified: z.boolean().default(false),
  usersNotifiedAt: z.date().optional(),
  authoritiesNotified: z.boolean().default(false),
  authoritiesNotifiedAt: z.date().optional(),
  
  // Status
  status: z.enum(['discovered', 'investigating', 'contained', 'resolved', 'closed']),
  
  // Audit
  reportedBy: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Privacy audit log
export const PrivacyAuditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  
  // Action details
  action: z.enum([
    'consent_granted',
    'consent_withdrawn',
    'data_exported',
    'data_deleted',
    'privacy_settings_updated',
    'data_accessed',
    'data_shared',
    'breach_detected',
    'retention_policy_applied'
  ]),
  
  // Context
  resourceType: z.string().max(100),
  resourceId: z.string().uuid().optional(),
  details: z.record(z.any()).optional(),
  
  // Metadata
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  sessionId: z.string().optional(),
  
  // Legal basis
  legalBasis: LegalBasisSchema.optional(),
  processingPurpose: ProcessingPurposeSchema.optional(),
  
  timestamp: z.date(),
  createdAt: z.date(),
});

// GDPR compliance status
export const GDPRComplianceStatusSchema = z.object({
  userId: z.string().uuid(),
  
  // Consent status
  hasValidConsent: z.boolean(),
  consentLastUpdated: z.date().optional(),
  
  // Data subject rights
  canExportData: z.boolean(),
  canDeleteData: z.boolean(),
  hasActiveDeletionRequest: z.boolean(),
  
  // Retention compliance
  dataRetentionCompliant: z.boolean(),
  oldestDataDate: z.date().optional(),
  
  // Breach notifications
  hasUnresolvedBreaches: z.boolean(),
  lastBreachNotification: z.date().optional(),
  
  // Overall compliance
  complianceScore: z.number().min(0).max(100),
  lastAssessment: z.date(),
});

// Type exports
export type ConsentType = z.infer<typeof ConsentTypeSchema>;
export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;
export type ProcessingPurpose = z.infer<typeof ProcessingPurposeSchema>;
export type DataCategory = z.infer<typeof DataCategorySchema>;
export type LegalBasis = z.infer<typeof LegalBasisSchema>;
export type UserConsent = z.infer<typeof UserConsentSchema>;
export type DataExportRequest = z.infer<typeof DataExportRequestSchema>;
export type DataDeletionRequest = z.infer<typeof DataDeletionRequestSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type DataBreachIncident = z.infer<typeof DataBreachIncidentSchema>;
export type PrivacyAuditLog = z.infer<typeof PrivacyAuditLogSchema>;
export type GDPRComplianceStatus = z.infer<typeof GDPRComplianceStatusSchema>;

// Helper functions
export const getConsentTypeDisplayName = (type: ConsentType): string => {
  const displayNames: Record<ConsentType, string> = {
    essential: 'Essential Services',
    functional: 'Functional Features',
    analytics: 'Analytics & Improvements',
    marketing: 'Marketing Communications',
    healthcare_sharing: 'Healthcare Provider Sharing',
    research_participation: 'Anonymous Research Participation',
    data_processing: 'Advanced Data Processing',
    third_party_integrations: 'Third-Party Integrations',
  };
  return displayNames[type];
};

export const getDataCategoryDisplayName = (category: DataCategory): string => {
  const displayNames: Record<DataCategory, string> = {
    personal_identifiers: 'Personal Identifiers (Name, Email)',
    health_data: 'Health & Symptom Data',
    biometric_data: 'Biometric Measurements',
    behavioral_data: 'Behavioral Patterns',
    technical_data: 'Technical & Device Data',
    usage_data: 'App Usage Statistics',
    communication_data: 'Communication Records',
    location_data: 'Location Information',
  };
  return displayNames[category];
};

export const getLegalBasisDisplayName = (basis: LegalBasis): string => {
  const displayNames: Record<LegalBasis, string> = {
    consent: 'Your explicit consent',
    contract: 'Performance of contract',
    legal_obligation: 'Legal obligation',
    vital_interests: 'Vital interests',
    public_task: 'Public task',
    legitimate_interests: 'Legitimate interests',
  };
  return displayNames[basis];
};

export const calculateRetentionDate = (
  createdDate: Date,
  retentionPeriod: string
): Date => {
  const date = new Date(createdDate);
  
  switch (retentionPeriod) {
    case '1_year':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case '2_years':
      date.setFullYear(date.getFullYear() + 2);
      break;
    case '5_years':
      date.setFullYear(date.getFullYear() + 5);
      break;
    case 'indefinite':
      date.setFullYear(date.getFullYear() + 100); // Effectively indefinite
      break;
    default:
      date.setFullYear(date.getFullYear() + 2); // Default to 2 years
  }
  
  return date;
};

export const isConsentExpired = (consent: UserConsent): boolean => {
  if (!consent.expiresAt) return false;
  return new Date() > consent.expiresAt;
};

export const isDataRetentionCompliant = (
  dataDate: Date,
  retentionPeriod: string
): boolean => {
  const retentionDate = calculateRetentionDate(dataDate, retentionPeriod);
  return new Date() <= retentionDate;
};

export const generateComplianceScore = (
  hasValidConsent: boolean,
  dataRetentionCompliant: boolean,
  hasUnresolvedBreaches: boolean,
  consentLastUpdated?: Date
): number => {
  let score = 0;
  
  // Valid consent (40 points)
  if (hasValidConsent) score += 40;
  
  // Data retention compliance (30 points)
  if (dataRetentionCompliant) score += 30;
  
  // No unresolved breaches (20 points)
  if (!hasUnresolvedBreaches) score += 20;
  
  // Recent consent update (10 points)
  if (consentLastUpdated) {
    const daysSinceUpdate = (Date.now() - consentLastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 365) score += 10; // Within last year
  }
  
  return Math.min(100, Math.max(0, score));
};

// Validation functions
export const validateUserConsent = (data: unknown): UserConsent => {
  return UserConsentSchema.parse(data);
};

export const validateDataExportRequest = (data: unknown): DataExportRequest => {
  return DataExportRequestSchema.parse(data);
};

export const validateDataDeletionRequest = (data: unknown): DataDeletionRequest => {
  return DataDeletionRequestSchema.parse(data);
};

export const validatePrivacySettings = (data: unknown): PrivacySettings => {
  return PrivacySettingsSchema.parse(data);
};

export const validateDataBreachIncident = (data: unknown): DataBreachIncident => {
  return DataBreachIncidentSchema.parse(data);
};