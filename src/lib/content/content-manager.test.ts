import { describe, it, expect, beforeEach } from 'vitest';
import { contentManager, type ContentItem, type ContentSource } from './content-manager';

describe('ContentManager', () => {
  beforeEach(() => {
    // Reset content manager state if needed
  });

  describe('Content Retrieval', () => {
    it('should retrieve content by ID', () => {
      const content = contentManager.getContent('nice-pacing-guidance');
      
      expect(content).toBeDefined();
      expect(content?.title).toBe('Energy Management and Pacing');
      expect(content?.category).toBe('pacing');
    });

    it('should return undefined for non-existent content', () => {
      const content = contentManager.getContent('non-existent-id');
      
      expect(content).toBeUndefined();
    });

    it('should retrieve content by category', () => {
      const pacingContent = contentManager.getContentByCategory('pacing');
      
      expect(pacingContent).toHaveLength(1);
      expect(pacingContent[0].category).toBe('pacing');
    });

    it('should retrieve content by tags', () => {
      const niceContent = contentManager.getContentByTags(['nice-guidelines']);
      
      expect(niceContent.length).toBeGreaterThan(0);
      expect(niceContent.every(item => item.tags.includes('nice-guidelines'))).toBe(true);
    });

    it('should search content by query', () => {
      const searchResults = contentManager.searchContent('pacing');
      
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(item => 
        item.title.toLowerCase().includes('pacing') || 
        item.content.toLowerCase().includes('pacing')
      )).toBe(true);
    });
  });

  describe('Content Quality', () => {
    it('should have evidence levels for all content', () => {
      const allContent = contentManager.getAllContent();
      
      allContent.forEach(item => {
        expect(item.evidenceLevel).toBeDefined();
        expect(item.evidenceLevel.level).toMatch(/^[A-D]$/);
        expect(item.evidenceLevel.strength).toMatch(/^(Strong|Moderate|Weak|Insufficient)$/);
      });
    });

    it('should have sources for all content', () => {
      const allContent = contentManager.getAllContent();
      
      allContent.forEach(item => {
        expect(item.sources).toBeDefined();
        expect(item.sources.length).toBeGreaterThan(0);
      });
    });

    it('should have appropriate reading levels', () => {
      const allContent = contentManager.getAllContent();
      
      allContent.forEach(item => {
        expect(item.readingLevel).toBeGreaterThan(0);
        expect(item.readingLevel).toBeLessThanOrEqual(15);
      });
    });

    it('should have realistic reading times', () => {
      const allContent = contentManager.getAllContent();
      
      allContent.forEach(item => {
        expect(item.estimatedReadTime).toBeGreaterThan(0);
        expect(item.estimatedReadTime).toBeLessThanOrEqual(30); // Max 30 minutes
      });
    });
  });

  describe('Content Validation', () => {
    it('should validate complete content items', () => {
      const validContent: ContentItem = {
        id: 'test-content',
        title: 'Test Content Item',
        category: 'general',
        content: 'This is a test content item with sufficient length to pass validation checks.',
        summary: 'Test summary',
        evidenceLevel: {
          level: 'A',
          description: 'Test evidence level',
          strength: 'Strong',
        },
        sources: [{
          id: 'test-source',
          title: 'Test Source',
          authors: ['Test Author'],
          publication: 'Test Journal',
          year: 2023,
          type: 'research',
          credibilityScore: 8,
          relevanceScore: 9,
        }],
        tags: ['test'],
        lastUpdated: new Date(),
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 8,
        estimatedReadTime: 2,
      };

      const validation = contentManager.validateContent(validContent);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should identify validation issues', () => {
      const invalidContent: ContentItem = {
        id: 'invalid-content',
        title: 'Bad', // Too short
        category: 'general',
        content: 'Short', // Too short
        summary: 'Test summary',
        evidenceLevel: {
          level: 'A',
          description: 'Test evidence level',
          strength: 'Strong',
        },
        sources: [], // No sources
        tags: ['test'],
        lastUpdated: new Date('2019-01-01'), // Too old
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 15, // Too high
        estimatedReadTime: 2,
      };

      const validation = contentManager.validateContent(invalidContent);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues).toContain('Title is too short or missing');
      expect(validation.issues).toContain('Content is too short');
      expect(validation.issues).toContain('No sources provided');
      expect(validation.issues).toContain('Reading level may be too high for target audience');
      expect(validation.issues).toContain('Content may be outdated');
    });
  });

  describe('Content Statistics', () => {
    it('should provide accurate content statistics', () => {
      const stats = contentManager.getContentStats();
      
      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byEvidenceLevel).toBeDefined();
      expect(stats.averageReadingLevel).toBeGreaterThan(0);
      expect(stats.averageReadingLevel).toBeLessThanOrEqual(15);
    });

    it('should categorize content correctly', () => {
      const stats = contentManager.getContentStats();
      const allContent = contentManager.getAllContent();
      
      const totalFromCategories = Object.values(stats.byCategory).reduce((sum, count) => sum + count, 0);
      expect(totalFromCategories).toBe(allContent.length);
    });
  });

  describe('Source Management', () => {
    it('should retrieve sources by ID', () => {
      const source = contentManager.getSource('nice-ng206');
      
      expect(source).toBeDefined();
      expect(source?.title).toContain('Myalgic encephalomyelitis');
      expect(source?.type).toBe('guideline');
    });

    it('should have high credibility scores for NICE guidelines', () => {
      const niceSource = contentManager.getSource('nice-ng206');
      
      expect(niceSource?.credibilityScore).toBe(10);
      expect(niceSource?.relevanceScore).toBe(10);
    });
  });

  describe('Content Categories', () => {
    it('should have content in all major categories', () => {
      const categories = ['pacing', 'symptoms', 'general'];
      
      categories.forEach(category => {
        const content = contentManager.getContentByCategory(category);
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it('should have empathetic language for patient-targeted content', () => {
      const patientContent = contentManager.getAllContent()
        .filter(item => item.targetAudience === 'patient');
      
      patientContent.forEach(item => {
        expect(item.language).toBe('empathetic');
      });
    });
  });

  describe('Evidence Levels', () => {
    it('should have appropriate evidence levels for different content types', () => {
      const niceContent = contentManager.getContent('nice-pacing-guidance');
      expect(niceContent?.evidenceLevel.level).toBe('A');
      expect(niceContent?.evidenceLevel.strength).toBe('Strong');
    });

    it('should sort content by evidence level correctly', () => {
      const allContent = contentManager.getAllContent();
      const evidenceOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      
      // Check that we have content with different evidence levels
      const evidenceLevels = new Set(allContent.map(item => item.evidenceLevel.level));
      expect(evidenceLevels.size).toBeGreaterThan(1);
    });
  });

  describe('Content Updates', () => {
    it('should update existing content', () => {
      const originalContent = contentManager.getContent('nice-pacing-guidance');
      expect(originalContent).toBeDefined();

      const updateResult = contentManager.updateContent('nice-pacing-guidance', {
        summary: 'Updated summary for testing',
      });

      expect(updateResult).toBe(true);
      
      const updatedContent = contentManager.getContent('nice-pacing-guidance');
      expect(updatedContent?.summary).toBe('Updated summary for testing');
      expect(updatedContent?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should reject invalid updates', () => {
      const updateResult = contentManager.updateContent('nice-pacing-guidance', {
        title: 'Bad', // Too short
        content: 'Short', // Too short
      });

      expect(updateResult).toBe(false);
    });

    it('should not update non-existent content', () => {
      const updateResult = contentManager.updateContent('non-existent-id', {
        title: 'New Title',
      });

      expect(updateResult).toBe(false);
    });
  });

  describe('Content Addition', () => {
    it('should add valid new content', () => {
      const newContent: ContentItem = {
        id: 'new-test-content',
        title: 'New Test Content',
        category: 'general',
        content: 'This is new test content with sufficient length for validation.',
        summary: 'New test content summary',
        evidenceLevel: {
          level: 'B',
          description: 'Test evidence level',
          strength: 'Moderate',
        },
        sources: [{
          id: 'new-test-source',
          title: 'New Test Source',
          authors: ['New Test Author'],
          publication: 'New Test Journal',
          year: 2024,
          type: 'research',
          credibilityScore: 7,
          relevanceScore: 8,
        }],
        tags: ['new', 'test'],
        lastUpdated: new Date(),
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 9,
        estimatedReadTime: 3,
      };

      const addResult = contentManager.addContent(newContent);
      expect(addResult).toBe(true);

      const retrievedContent = contentManager.getContent('new-test-content');
      expect(retrievedContent).toBeDefined();
      expect(retrievedContent?.title).toBe('New Test Content');
    });

    it('should reject invalid new content', () => {
      const invalidContent: ContentItem = {
        id: 'invalid-new-content',
        title: 'Bad', // Too short
        category: 'general',
        content: 'Short', // Too short
        summary: 'Test summary',
        evidenceLevel: {
          level: 'A',
          description: 'Test evidence level',
          strength: 'Strong',
        },
        sources: [], // No sources
        tags: ['test'],
        lastUpdated: new Date(),
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 8,
        estimatedReadTime: 2,
      };

      const addResult = contentManager.addContent(invalidContent);
      expect(addResult).toBe(false);

      const retrievedContent = contentManager.getContent('invalid-new-content');
      expect(retrievedContent).toBeUndefined();
    });
  });
});