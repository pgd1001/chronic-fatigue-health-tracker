import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import {
  users,
  userProfiles,
  dailyHealthLogs,
  movementSessions,
  biometricMeasurements,
  sleepLogs,
  nutritionLogs,
  healthReports,
} from '../db/schema';
import {
  handleDatabaseError,
  NotFoundError,
  withRetry,
  formatDateForDB,
} from '../db/utils';
import {
  type UserConsent,
  type DataExportRequest,
  type DataDeletionRequest,
  type PrivacySettings,
  type DataBreachIncident,
  type PrivacyAuditLog,
  type GDPRComplianceStatus,
  type ConsentType,
  type DataCategory,
  type LegalBasis,
  calculateRetentionDate,
  isConsentExpired,
  isDataRetentionCompliant,
  generateComplianceScore,
} from '../types/privacy.types';

export class PrivacyService {
  // Consent Management
  static async grantConsent(
    userId: string,
    consentType: ConsentType,
    consentData: {
      legalBasis: LegalBasis;
      processingPurposes: string[];
      dataCategories: DataCategory[];
      consentText: string;
      consentVersion: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<UserConsent> {
    try {
      return await withRetry(async () => {
        // Withdraw any existing consent of the same type
        await this.withdrawConsent(userId, consentType, 'consent_updated');

        const consent: UserConsent = {
          id: crypto.randomUUID(),
          userId,
          consentType,
          status: 'granted',
          legalBasis: consentData.legalBasis,
          processingPurposes: consentData.processingPurposes as any,
          dataCategories: consentData.dataCategories,
          consentText: consentData.consentText,
          consentVersion: consentData.consentVersion,
          consentLanguage: 'en', // Default to English
          grantedAt: new Date(),
          expiresAt: this.calculateConsentExpiry(consentType),
          lastUpdatedAt: new Date(),
          ipAddress: consentData.ipAddress,
          userAgent: consentData.userAgent,
          consentMethod: 'explicit_click',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to database (would need to create consent table)
        // For now, we'll store in a JSON field or separate table
        
        // Log the consent action
        await this.logPrivacyAction(userId, 'consent_granted', 'user_consent', consent.id, {
          consentType,
          legalBasis: consentData.legalBasis,
        });

        return consent;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    reason: string = 'user_request'
  ): Promise<void> {
    try {
      await withRetry(async () => {
        // Update consent status to withdrawn
        // This would update the consent table
        
        // Log the withdrawal
        await this.logPrivacyAction(userId, 'consent_withdrawn', 'user_consent', undefined, {
          consentType,
          reason,
        });
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Data Export (Right to Data Portability)
  static async requestDataExport(
    userId: string,
    exportRequest: {
      requestType: 'full_export' | 'partial_export' | 'specific_categories';
      dataCategories?: DataCategory[];
      format: 'json' | 'csv' | 'pdf' | 'xml';
      dateRange?: { startDate?: string; endDate?: string };
      includeMetadata?: boolean;
    }
  ): Promise<DataExportRequest> {
    try {
      return await withRetry(async () => {
        const request: DataExportRequest = {
          id: crypto.randomUUID(),
          userId,
          requestType: exportRequest.requestType,
          dataCategories: exportRequest.dataCategories,
          dateRange: exportRequest.dateRange,
          format: exportRequest.format,
          includeMetadata: exportRequest.includeMetadata ?? true,
          anonymizeData: false,
          status: 'pending',
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save export request to database
        // This would be stored in a data_export_requests table
        
        // Start processing the export asynchronously
        this.processDataExport(request.id);

        // Log the export request
        await this.logPrivacyAction(userId, 'data_exported', 'export_request', request.id, {
          requestType: exportRequest.requestType,
          format: exportRequest.format,
        });

        return request;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async processDataExport(requestId: string): Promise<void> {
    try {
      // This would be implemented as a background job
      // For now, we'll outline the process
      
      // 1. Retrieve export request
      // 2. Gather all user data based on request parameters
      // 3. Format data according to requested format
      // 4. Generate secure download link
      // 5. Update request status to completed
      // 6. Send notification to user
      
      console.log(`Processing data export request: ${requestId}`);
    } catch (error) {
      console.error('Failed to process data export:', error);
    }
  }

  static async generateUserDataExport(
    userId: string,
    categories: DataCategory[] = [],
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<any> {
    try {
      return await withRetry(async () => {
        const exportData: any = {
          exportMetadata: {
            userId,
            exportDate: new Date().toISOString(),
            format,
            categories: categories.length > 0 ? categories : 'all',
          },
          userData: {},
        };

        // Personal identifiers
        if (categories.length === 0 || categories.includes('personal_identifiers')) {
          const [user] = await db.select().from(users).where(eq(users.id, userId));
          const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
          
          exportData.userData.personalData = {
            user: user ? {
              id: user.id,
              email: user.email,
              name: user.name,
              createdAt: user.createdAt,
            } : null,
            profile: profile ? {
              dateOfBirth: profile.dateOfBirth,
              height: profile.height,
              weight: profile.weight,
              primaryCondition: profile.primaryCondition,
              diagnosisDate: profile.diagnosisDate,
              timeZone: profile.timeZone,
            } : null,
          };
        }

        // Health data
        if (categories.length === 0 || categories.includes('health_data')) {
          const healthLogs = await db
            .select()
            .from(dailyHealthLogs)
            .where(eq(dailyHealthLogs.userId, userId))
            .orderBy(desc(dailyHealthLogs.date));

          exportData.userData.healthData = {
            dailyHealthLogs: healthLogs,
            totalEntries: healthLogs.length,
          };
        }

        // Biometric data
        if (categories.length === 0 || categories.includes('biometric_data')) {
          const biometrics = await db
            .select()
            .from(biometricMeasurements)
            .where(eq(biometricMeasurements.userId, userId))
            .orderBy(desc(biometricMeasurements.timestamp));

          exportData.userData.biometricData = {
            measurements: biometrics,
            totalMeasurements: biometrics.length,
          };
        }

        // Behavioral data (movement sessions)
        if (categories.length === 0 || categories.includes('behavioral_data')) {
          const movements = await db
            .select()
            .from(movementSessions)
            .where(eq(movementSessions.userId, userId))
            .orderBy(desc(movementSessions.date));

          const sleepData = await db
            .select()
            .from(sleepLogs)
            .where(eq(sleepLogs.userId, userId))
            .orderBy(desc(sleepLogs.date));

          const nutritionData = await db
            .select()
            .from(nutritionLogs)
            .where(eq(nutritionLogs.userId, userId))
            .orderBy(desc(nutritionLogs.date));

          exportData.userData.behavioralData = {
            movementSessions: movements,
            sleepLogs: sleepData,
            nutritionLogs: nutritionData,
          };
        }

        // Healthcare reports
        const reports = await db
          .select()
          .from(healthReports)
          .where(eq(healthReports.userId, userId))
          .orderBy(desc(healthReports.generatedAt));

        exportData.userData.healthcareReports = {
          reports: reports.map(report => ({
            id: report.id,
            reportType: report.reportType,
            startDate: report.startDate,
            endDate: report.endDate,
            generatedAt: report.generatedAt,
          })),
          totalReports: reports.length,
        };

        return exportData;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Data Deletion (Right to Erasure)
  static async requestDataDeletion(
    userId: string,
    deletionRequest: {
      deletionType: 'full_account' | 'specific_data' | 'retention_period_expired';
      dataCategories?: DataCategory[];
      reason: 'withdrawal_of_consent' | 'no_longer_necessary' | 'unlawful_processing' | 'compliance_obligation' | 'user_request';
      reasonDescription?: string;
    }
  ): Promise<DataDeletionRequest> {
    try {
      return await withRetry(async () => {
        const request: DataDeletionRequest = {
          id: crypto.randomUUID(),
          userId,
          deletionType: deletionRequest.deletionType,
          dataCategories: deletionRequest.dataCategories,
          reason: deletionRequest.reason,
          reasonDescription: deletionRequest.reasonDescription,
          retentionOverride: false,
          status: 'pending',
          requestedAt: new Date(),
          scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day grace period
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save deletion request to database
        // This would be stored in a data_deletion_requests table
        
        // Log the deletion request
        await this.logPrivacyAction(userId, 'data_deleted', 'deletion_request', request.id, {
          deletionType: deletionRequest.deletionType,
          reason: deletionRequest.reason,
        });

        return request;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async processDataDeletion(requestId: string): Promise<void> {
    try {
      // This would be implemented as a scheduled job
      // 1. Retrieve deletion request
      // 2. Check if grace period has passed
      // 3. Verify no legal obligations to retain data
      // 4. Delete data according to request parameters
      // 5. Update request status to completed
      // 6. Send confirmation to user
      
      console.log(`Processing data deletion request: ${requestId}`);
    } catch (error) {
      console.error('Failed to process data deletion:', error);
    }
  }

  static async deleteUserData(
    userId: string,
    categories: DataCategory[] = [],
    fullAccount: boolean = false
  ): Promise<void> {
    try {
      await withRetry(async () => {
        if (fullAccount) {
          // Delete all user data
          await db.delete(healthReports).where(eq(healthReports.userId, userId));
          await db.delete(nutritionLogs).where(eq(nutritionLogs.userId, userId));
          await db.delete(sleepLogs).where(eq(sleepLogs.userId, userId));
          await db.delete(biometricMeasurements).where(eq(biometricMeasurements.userId, userId));
          await db.delete(movementSessions).where(eq(movementSessions.userId, userId));
          await db.delete(dailyHealthLogs).where(eq(dailyHealthLogs.userId, userId));
          await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
          await db.delete(users).where(eq(users.id, userId));
        } else {
          // Delete specific categories
          for (const category of categories) {
            switch (category) {
              case 'health_data':
                await db.delete(dailyHealthLogs).where(eq(dailyHealthLogs.userId, userId));
                break;
              case 'biometric_data':
                await db.delete(biometricMeasurements).where(eq(biometricMeasurements.userId, userId));
                break;
              case 'behavioral_data':
                await db.delete(movementSessions).where(eq(movementSessions.userId, userId));
                await db.delete(sleepLogs).where(eq(sleepLogs.userId, userId));
                await db.delete(nutritionLogs).where(eq(nutritionLogs.userId, userId));
                break;
              // Add other categories as needed
            }
          }
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Privacy Settings Management
  static async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      return await withRetry(async () => {
        // This would retrieve from privacy_settings table
        // For now, return default settings
        return {
          id: crypto.randomUUID(),
          userId,
          allowHealthcareSharing: false,
          allowAnonymizedResearch: false,
          allowAnalytics: true,
          allowMarketing: false,
          dataRetentionPeriod: '2_years',
          autoDeleteInactiveData: true,
          privacyNotifications: true,
          dataBreachNotifications: true,
          policyUpdateNotifications: true,
          twoFactorRequired: false,
          sessionTimeout: 60,
          allowDataExport: true,
          exportNotifications: true,
          updatedAt: new Date(),
          createdAt: new Date(),
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      return await withRetry(async () => {
        const currentSettings = await this.getPrivacySettings(userId);
        const updatedSettings = {
          ...currentSettings,
          ...settings,
          updatedAt: new Date(),
        };

        // Save to database
        // This would update the privacy_settings table
        
        // Log the settings update
        await this.logPrivacyAction(userId, 'privacy_settings_updated', 'privacy_settings', userId, {
          updatedFields: Object.keys(settings),
        });

        return updatedSettings;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Data Breach Management
  static async reportDataBreach(
    incidentData: {
      incidentType: 'unauthorized_access' | 'data_loss' | 'system_compromise' | 'human_error' | 'third_party_breach' | 'malicious_attack';
      severity: 'low' | 'medium' | 'high' | 'critical';
      affectedDataCategories: DataCategory[];
      affectedUserCount: number;
      description: string;
      impactAssessment: string;
      discoveredAt: Date;
      occurredAt?: Date;
    }
  ): Promise<DataBreachIncident> {
    try {
      return await withRetry(async () => {
        const incident: DataBreachIncident = {
          id: crypto.randomUUID(),
          incidentType: incidentData.incidentType,
          severity: incidentData.severity,
          affectedDataCategories: incidentData.affectedDataCategories,
          affectedUserCount: incidentData.affectedUserCount,
          description: incidentData.description,
          impactAssessment: incidentData.impactAssessment,
          discoveredAt: incidentData.discoveredAt,
          occurredAt: incidentData.occurredAt,
          mitigationActions: [],
          usersNotified: false,
          authoritiesNotified: false,
          status: 'discovered',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to database
        // This would be stored in a data_breach_incidents table
        
        // Automatically notify authorities if severity is high or critical
        if (incident.severity === 'high' || incident.severity === 'critical') {
          await this.notifyAuthorities(incident.id);
        }

        return incident;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async notifyAffectedUsers(incidentId: string): Promise<void> {
    try {
      // This would send notifications to all affected users
      // Implementation would depend on notification system
      console.log(`Notifying users about breach incident: ${incidentId}`);
    } catch (error) {
      console.error('Failed to notify users about breach:', error);
    }
  }

  static async notifyAuthorities(incidentId: string): Promise<void> {
    try {
      // This would notify relevant data protection authorities
      // Implementation would depend on jurisdiction and requirements
      console.log(`Notifying authorities about breach incident: ${incidentId}`);
    } catch (error) {
      console.error('Failed to notify authorities about breach:', error);
    }
  }

  // GDPR Compliance Assessment
  static async assessGDPRCompliance(userId: string): Promise<GDPRComplianceStatus> {
    try {
      return await withRetry(async () => {
        // Check consent status
        const hasValidConsent = true; // Would check actual consent records
        const consentLastUpdated = new Date(); // Would get from consent records

        // Check data retention compliance
        const oldestData = await this.getOldestUserData(userId);
        const privacySettings = await this.getPrivacySettings(userId);
        const dataRetentionCompliant = oldestData ? 
          isDataRetentionCompliant(oldestData, privacySettings.dataRetentionPeriod) : true;

        // Check for unresolved breaches
        const hasUnresolvedBreaches = false; // Would check breach incidents

        const complianceScore = generateComplianceScore(
          hasValidConsent,
          dataRetentionCompliant,
          hasUnresolvedBreaches,
          consentLastUpdated
        );

        return {
          userId,
          hasValidConsent,
          consentLastUpdated,
          canExportData: true,
          canDeleteData: true,
          hasActiveDeletionRequest: false, // Would check deletion requests
          dataRetentionCompliant,
          oldestDataDate: oldestData,
          hasUnresolvedBreaches,
          complianceScore,
          lastAssessment: new Date(),
        };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Helper methods
  private static calculateConsentExpiry(consentType: ConsentType): Date | undefined {
    // Some consent types may have expiry dates
    const expiryMonths: Partial<Record<ConsentType, number>> = {
      marketing: 12, // Marketing consent expires after 1 year
      research_participation: 24, // Research consent expires after 2 years
    };

    const months = expiryMonths[consentType];
    if (months) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);
      return expiry;
    }

    return undefined; // No expiry for other consent types
  }

  private static async getOldestUserData(userId: string): Promise<Date | null> {
    try {
      const [oldestLog] = await db
        .select({ createdAt: dailyHealthLogs.createdAt })
        .from(dailyHealthLogs)
        .where(eq(dailyHealthLogs.userId, userId))
        .orderBy(dailyHealthLogs.createdAt)
        .limit(1);

      return oldestLog?.createdAt || null;
    } catch (error) {
      return null;
    }
  }

  private static async logPrivacyAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    try {
      const auditLog: PrivacyAuditLog = {
        id: crypto.randomUUID(),
        userId,
        action: action as any,
        resourceType,
        resourceId,
        details,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      // Save to audit log table
      console.log('Privacy action logged:', auditLog);
    } catch (error) {
      console.error('Failed to log privacy action:', error);
    }
  }
}