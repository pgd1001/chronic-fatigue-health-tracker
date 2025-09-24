import {
  ConsentTypeSchema,
  ConsentStatusSchema,
  ProcessingPurposeSchema,
  DataCategorySchema,
  LegalBasisSchema,
  UserConsentSchema,
  DataExportRequestSchema,
  DataDeletionRequestSchema,
  PrivacySettingsSchema,
  DataBreachIncidentSchema,
  PrivacyAuditLogSchema,
  GDPRComplianceStatusSchema,
  validateUserConsent,
  validateDataExportRequest,
  validateDataDeletionRequest,
  validatePrivacySettings,
  validateDataBreachIncident,
  getConsentTypeDisplayName,
  getDataCategoryDisplayName,
  getLegalBasisDisplayName,
  calculateRetentionDate,
  isConsentExpired,
  isDataRetentionCompliant,
  generateComplianceScore,
} from './privacy.types';

describe('Privacy Types', () => {
  describe('Schema Validations', () => {
    describe('ConsentTypeSchema', () => {
      it('validates valid consent types', () => {
        const validTypes = [
          'essential',
          'functional',
          'analytics',
          'marketing',
          'healthcare_sharing',
          'research_participation',
          'data_processing',
          'third_party_integrations'
        ];

        validTypes.forEach(type => {
          expect(() => ConsentTypeSchema.parse(type)).not.toThrow();
        });
      });

      it('rejects invalid consent types', () => {
        const invalidTypes = ['invalid', 'random', 123, null, undefined];
        
        invalidTypes.forEach(type => {
          expect(() => ConsentTypeSchema.parse(type)).toThrow();
        });
      });
    });

    describe('DataCategorySchema', () => {
      it('validates valid data categories', () => {
        const validCategories = [
          'personal_identifiers',
          'health_data',
          'biometric_data',
          'behavioral_data',
          'technical_data',
          'usage_data',
          'communication_data',
          'location_data'
        ];

        validCategories.forEach(category => {
          expect(() => DataCategorySchema.parse(category)).not.toThrow();
        });
      });
    });

    describe('LegalBasisSchema', () => {
      it('validates valid legal basis options', () => {
        const validBases = [
          'consent',
          'contract',
          'legal_obligation',
          'vital_interests',
          'public_task',
          'legitimate_interests'
        ];

        validBases.forEach(basis => {
          expect(() => LegalBasisSchema.parse(basis)).not.toThrow();
        });
      });
    });
  });

  describe('UserConsentSchema', () => {
    it('validates complete user consent', () => {
      const validConsent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        consentType: 'healthcare_sharing',
        status: 'granted',
        legalBasis: 'consent',
        processingPurposes: ['healthcare_reporting', 'service_provision'],
        dataCategories: ['health_data', 'personal_identifiers'],
        consentText: 'I consent to sharing my health data with healthcare providers.',
        consentVersion: '1.0',
        consentLanguage: 'en',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        lastUpdatedAt: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        consentMethod: 'explicit_click',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => UserConsentSchema.parse(validConsent)).not.toThrow();
    });

    it('validates minimal user consent', () => {
      const minimalConsent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        consentType: 'essential',
        status: 'granted',
        legalBasis: 'contract',
        processingPurposes: ['service_provision'],
        dataCategories: ['personal_identifiers'],
        consentText: 'Essential services consent',
        consentVersion: '1.0',
        consentLanguage: 'en',
        lastUpdatedAt: new Date(),
        consentMethod: 'form_submission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => UserConsentSchema.parse(minimalConsent)).not.toThrow();
    });

    it('rejects invalid consent with wrong language code', () => {
      const invalidConsent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        consentType: 'essential',
        status: 'granted',
        legalBasis: 'consent',
        processingPurposes: ['service_provision'],
        dataCategories: ['personal_identifiers'],
        consentText: 'Test consent',
        consentVersion: '1.0',
        consentLanguage: 'english', // Should be 'en'
        lastUpdatedAt: new Date(),
        consentMethod: 'explicit_click',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => UserConsentSchema.parse(invalidConsent)).toThrow();
    });
  });

  describe('DataExportRequestSchema', () => {
    it('validates complete export request', () => {
      const validRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        requestType: 'full_export',
        format: 'json',
        includeMetadata: true,
        anonymizeData: false,
        status: 'pending',
        requestedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataExportRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('validates partial export request with categories', () => {
      const partialRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        requestType: 'specific_categories',
        dataCategories: ['health_data', 'biometric_data'],
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        format: 'csv',
        includeMetadata: true,
        anonymizeData: false,
        status: 'processing',
        requestedAt: new Date(),
        processedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataExportRequestSchema.parse(partialRequest)).not.toThrow();
    });

    it('rejects invalid export format', () => {
      const invalidRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        requestType: 'full_export',
        format: 'invalid_format',
        status: 'pending',
        requestedAt: new Date(),
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataExportRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('DataDeletionRequestSchema', () => {
    it('validates complete deletion request', () => {
      const validRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        deletionType: 'full_account',
        reason: 'user_request',
        reasonDescription: 'No longer need the service',
        retentionOverride: false,
        status: 'pending',
        requestedAt: new Date(),
        scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataDeletionRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('validates specific data deletion request', () => {
      const specificRequest = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        deletionType: 'specific_data',
        dataCategories: ['biometric_data', 'location_data'],
        reason: 'withdrawal_of_consent',
        retentionOverride: false,
        status: 'approved',
        requestedAt: new Date(),
        approvedAt: new Date(),
        scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataDeletionRequestSchema.parse(specificRequest)).not.toThrow();
    });
  });

  describe('PrivacySettingsSchema', () => {
    it('validates complete privacy settings', () => {
      const validSettings = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        allowHealthcareSharing: true,
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

      expect(() => PrivacySettingsSchema.parse(validSettings)).not.toThrow();
    });

    it('validates settings with boundary values', () => {
      const boundarySettings = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        allowHealthcareSharing: false,
        allowAnonymizedResearch: false,
        allowAnalytics: false,
        allowMarketing: false,
        dataRetentionPeriod: 'indefinite',
        autoDeleteInactiveData: false,
        privacyNotifications: false,
        dataBreachNotifications: true, // Should always be true for legal compliance
        policyUpdateNotifications: false,
        twoFactorRequired: true,
        sessionTimeout: 15, // Minimum
        allowDataExport: true,
        exportNotifications: false,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      expect(() => PrivacySettingsSchema.parse(boundarySettings)).not.toThrow();
    });

    it('rejects invalid session timeout', () => {
      const invalidSettings = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        sessionTimeout: 10, // Below minimum of 15
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      expect(() => PrivacySettingsSchema.parse(invalidSettings)).toThrow();
    });
  });

  describe('DataBreachIncidentSchema', () => {
    it('validates complete breach incident', () => {
      const validIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incidentType: 'unauthorized_access',
        severity: 'high',
        affectedDataCategories: ['health_data', 'personal_identifiers'],
        affectedUserCount: 150,
        affectedUsers: ['123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003'],
        discoveredAt: new Date(),
        occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        containedAt: new Date(),
        description: 'Unauthorized access to user health records',
        impactAssessment: 'Potential exposure of sensitive health information',
        mitigationActions: ['Changed passwords', 'Implemented additional security'],
        usersNotified: true,
        usersNotifiedAt: new Date(),
        authoritiesNotified: true,
        authoritiesNotifiedAt: new Date(),
        status: 'contained',
        reportedBy: '123e4567-e89b-12d3-a456-426614174004',
        assignedTo: '123e4567-e89b-12d3-a456-426614174005',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataBreachIncidentSchema.parse(validIncident)).not.toThrow();
    });

    it('validates minimal breach incident', () => {
      const minimalIncident = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        incidentType: 'human_error',
        severity: 'low',
        affectedDataCategories: ['usage_data'],
        affectedUserCount: 5,
        discoveredAt: new Date(),
        description: 'Accidental data exposure',
        impactAssessment: 'Minimal impact on user privacy',
        mitigationActions: ['Corrected the error'],
        usersNotified: false,
        authoritiesNotified: false,
        status: 'discovered',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => DataBreachIncidentSchema.parse(minimalIncident)).not.toThrow();
    });
  });

  describe('GDPRComplianceStatusSchema', () => {
    it('validates complete compliance status', () => {
      const validStatus = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        hasValidConsent: true,
        consentLastUpdated: new Date(),
        canExportData: true,
        canDeleteData: true,
        hasActiveDeletionRequest: false,
        dataRetentionCompliant: true,
        oldestDataDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        hasUnresolvedBreaches: false,
        complianceScore: 95,
        lastAssessment: new Date(),
      };

      expect(() => GDPRComplianceStatusSchema.parse(validStatus)).not.toThrow();
    });

    it('validates compliance status with issues', () => {
      const statusWithIssues = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        hasValidConsent: false,
        canExportData: true,
        canDeleteData: false,
        hasActiveDeletionRequest: true,
        dataRetentionCompliant: false,
        hasUnresolvedBreaches: true,
        lastBreachNotification: new Date(),
        complianceScore: 25,
        lastAssessment: new Date(),
      };

      expect(() => GDPRComplianceStatusSchema.parse(statusWithIssues)).not.toThrow();
    });
  });

  describe('Validation Functions', () => {
    describe('validateUserConsent', () => {
      it('validates and returns valid consent', () => {
        const validData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          consentType: 'essential',
          status: 'granted',
          legalBasis: 'contract',
          processingPurposes: ['service_provision'],
          dataCategories: ['personal_identifiers'],
          consentText: 'Essential consent',
          consentVersion: '1.0',
          consentLanguage: 'en',
          lastUpdatedAt: new Date(),
          consentMethod: 'explicit_click',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateUserConsent(validData);
        expect(result).toEqual(expect.objectContaining({
          id: validData.id,
          consentType: validData.consentType,
        }));
      });

      it('throws error for invalid consent', () => {
        const invalidData = {
          id: 'invalid-uuid',
          consentType: 'invalid_type',
        };

        expect(() => validateUserConsent(invalidData)).toThrow();
      });
    });

    describe('validateDataExportRequest', () => {
      it('validates and returns valid export request', () => {
        const validData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          requestType: 'full_export',
          format: 'json',
          includeMetadata: true,
          anonymizeData: false,
          status: 'pending',
          requestedAt: new Date(),
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateDataExportRequest(validData);
        expect(result).toEqual(expect.objectContaining(validData));
      });
    });

    describe('validateDataDeletionRequest', () => {
      it('validates and returns valid deletion request', () => {
        const validData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          deletionType: 'full_account',
          reason: 'user_request',
          retentionOverride: false,
          status: 'pending',
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateDataDeletionRequest(validData);
        expect(result).toEqual(expect.objectContaining(validData));
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getConsentTypeDisplayName', () => {
      it('returns correct display names', () => {
        expect(getConsentTypeDisplayName('essential')).toBe('Essential Services');
        expect(getConsentTypeDisplayName('healthcare_sharing')).toBe('Healthcare Provider Sharing');
        expect(getConsentTypeDisplayName('research_participation')).toBe('Anonymous Research Participation');
      });
    });

    describe('getDataCategoryDisplayName', () => {
      it('returns correct display names', () => {
        expect(getDataCategoryDisplayName('personal_identifiers')).toBe('Personal Identifiers (Name, Email)');
        expect(getDataCategoryDisplayName('health_data')).toBe('Health & Symptom Data');
        expect(getDataCategoryDisplayName('biometric_data')).toBe('Biometric Measurements');
      });
    });

    describe('getLegalBasisDisplayName', () => {
      it('returns correct display names', () => {
        expect(getLegalBasisDisplayName('consent')).toBe('Your explicit consent');
        expect(getLegalBasisDisplayName('contract')).toBe('Performance of contract');
        expect(getLegalBasisDisplayName('legal_obligation')).toBe('Legal obligation');
      });
    });

    describe('calculateRetentionDate', () => {
      it('calculates correct retention dates', () => {
        const baseDate = new Date('2024-01-01');
        
        const oneYear = calculateRetentionDate(baseDate, '1_year');
        expect(oneYear.getFullYear()).toBe(2025);
        
        const twoYears = calculateRetentionDate(baseDate, '2_years');
        expect(twoYears.getFullYear()).toBe(2026);
        
        const fiveYears = calculateRetentionDate(baseDate, '5_years');
        expect(fiveYears.getFullYear()).toBe(2029);
        
        const indefinite = calculateRetentionDate(baseDate, 'indefinite');
        expect(indefinite.getFullYear()).toBe(2124); // 100 years later
      });
    });

    describe('isConsentExpired', () => {
      it('correctly identifies expired consent', () => {
        const expiredConsent = {
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        } as any;
        
        const validConsent = {
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        } as any;
        
        const noExpiryConsent = {
          expiresAt: undefined,
        } as any;
        
        expect(isConsentExpired(expiredConsent)).toBe(true);
        expect(isConsentExpired(validConsent)).toBe(false);
        expect(isConsentExpired(noExpiryConsent)).toBe(false);
      });
    });

    describe('isDataRetentionCompliant', () => {
      it('correctly checks retention compliance', () => {
        const oldData = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000); // 3 years ago
        const recentData = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        
        expect(isDataRetentionCompliant(oldData, '2_years')).toBe(false);
        expect(isDataRetentionCompliant(recentData, '2_years')).toBe(true);
        expect(isDataRetentionCompliant(oldData, 'indefinite')).toBe(true);
      });
    });

    describe('generateComplianceScore', () => {
      it('calculates compliance score correctly', () => {
        // Perfect compliance
        const perfectScore = generateComplianceScore(
          true, // hasValidConsent
          true, // dataRetentionCompliant
          false, // hasUnresolvedBreaches
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Recent consent
        );
        expect(perfectScore).toBe(100);
        
        // Poor compliance
        const poorScore = generateComplianceScore(
          false, // hasValidConsent
          false, // dataRetentionCompliant
          true, // hasUnresolvedBreaches
          undefined // no consent update
        );
        expect(poorScore).toBe(0);
        
        // Partial compliance
        const partialScore = generateComplianceScore(
          true, // hasValidConsent
          false, // dataRetentionCompliant
          false, // hasUnresolvedBreaches
          new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) // Old consent
        );
        expect(partialScore).toBe(60); // 40 + 0 + 20 + 0
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles maximum string lengths', () => {
      const maxLengthConsent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        consentType: 'healthcare_sharing',
        status: 'granted',
        legalBasis: 'consent',
        processingPurposes: ['healthcare_reporting'],
        dataCategories: ['health_data'],
        consentText: 'a'.repeat(2000), // Max length
        consentVersion: 'a'.repeat(50), // Max length
        consentLanguage: 'en',
        lastUpdatedAt: new Date(),
        userAgent: 'a'.repeat(500), // Max length
        consentMethod: 'explicit_click',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => UserConsentSchema.parse(maxLengthConsent)).not.toThrow();
    });

    it('handles all valid enum values', () => {
      const allEnumValues = {
        consentTypes: ['essential', 'functional', 'analytics', 'marketing'],
        statuses: ['granted', 'denied', 'withdrawn', 'pending', 'expired'],
        purposes: ['service_provision', 'health_tracking', 'analytics_improvement'],
        categories: ['personal_identifiers', 'health_data', 'biometric_data'],
        legalBases: ['consent', 'contract', 'legal_obligation'],
      };

      // Test that all enum values are valid
      allEnumValues.consentTypes.forEach(type => {
        expect(() => ConsentTypeSchema.parse(type)).not.toThrow();
      });
      
      allEnumValues.statuses.forEach(status => {
        expect(() => ConsentStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('handles boundary compliance scores', () => {
      expect(generateComplianceScore(false, false, true, undefined)).toBe(0);
      expect(generateComplianceScore(true, true, false, new Date())).toBe(100);
    });
  });
});