// Evidence-Based Content Management System
// Manages NICE guidelines, research citations, and educational content

export interface ContentSource {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  year: number;
  doi?: string;
  url?: string;
  type: 'research' | 'guideline' | 'review' | 'clinical-trial';
  credibilityScore: number; // 1-10 scale
  relevanceScore: number; // 1-10 scale for ME/CFS and Long COVID
}

export interface EvidenceLevel {
  level: 'A' | 'B' | 'C' | 'D';
  description: string;
  strength: 'Strong' | 'Moderate' | 'Weak' | 'Insufficient';
}

export interface ContentItem {
  id: string;
  title: string;
  category: 'pacing' | 'symptoms' | 'movement' | 'nutrition' | 'sleep' | 'general';
  subcategory?: string;
  content: string;
  summary: string;
  evidenceLevel: EvidenceLevel;
  sources: ContentSource[];
  tags: string[];
  lastUpdated: Date;
  reviewedBy?: string;
  validatedBy?: string;
  language: 'empathetic' | 'clinical' | 'educational';
  targetAudience: 'patient' | 'caregiver' | 'healthcare-provider';
  readingLevel: number; // Flesch-Kincaid grade level
  estimatedReadTime: number; // in minutes
}

export interface ContentCollection {
  id: string;
  name: string;
  description: string;
  items: ContentItem[];
  category: string;
  lastUpdated: Date;
}

class ContentManager {
  private content: Map<string, ContentItem> = new Map();
  private collections: Map<string, ContentCollection> = new Map();
  private sources: Map<string, ContentSource> = new Map();

  constructor() {
    this.initializeContent();
  }

  // Initialize with evidence-based content
  private initializeContent(): void {
    // Load NICE guidelines content
    this.loadNICEGuidelines();
    
    // Load research-based content
    this.loadResearchContent();
    
    // Load educational content
    this.loadEducationalContent();
    
    // Load additional evidence-based content
    this.loadAdditionalContent();
  }

  private loadNICEGuidelines(): void {
    // NICE Guideline NG206: Myalgic encephalomyelitis (or encephalopathy)/chronic fatigue syndrome
    const niceSource: ContentSource = {
      id: 'nice-ng206',
      title: 'Myalgic encephalomyelitis (or encephalopathy)/chronic fatigue syndrome: diagnosis and management',
      authors: ['NICE Guideline Development Group'],
      publication: 'National Institute for Health and Care Excellence',
      year: 2021,
      url: 'https://www.nice.org.uk/guidance/ng206',
      type: 'guideline',
      credibilityScore: 10,
      relevanceScore: 10,
    };

    this.sources.set(niceSource.id, niceSource);

    // Pacing content based on NICE guidelines
    const pacingContent: ContentItem = {
      id: 'nice-pacing-guidance',
      title: 'Energy Management and Pacing',
      category: 'pacing',
      content: `
        Energy management, also known as pacing, is a key strategy for managing ME/CFS symptoms. 
        The NICE guidelines emphasize that pacing should be personalized and flexible, allowing you 
        to stay within your energy limits while gradually building tolerance for activity.

        **Key Principles:**
        - Stay within your "energy envelope" - the amount of energy you have available
        - Break activities into smaller, manageable chunks
        - Plan rest periods before you become exhausted
        - Listen to your body's signals and adjust accordingly
        - Avoid "boom and bust" cycles of overactivity followed by crashes

        **How to Pace:**
        1. **Identify your baseline** - the amount of activity you can do on your worst days
        2. **Plan activities** around your energy levels and symptoms
        3. **Use timers** to limit activity periods and ensure regular rest
        4. **Prioritize** essential activities and delegate when possible
        5. **Be flexible** - adjust your plans based on how you feel each day

        Remember, pacing is not about pushing through symptoms or gradually increasing activity 
        regardless of how you feel. It's about finding a sustainable balance that prevents 
        symptom worsening and may allow for gradual improvement over time.
      `,
      summary: 'Evidence-based pacing strategies from NICE guidelines to help manage energy and prevent symptom worsening.',
      evidenceLevel: {
        level: 'A',
        description: 'High-quality evidence from systematic reviews and clinical guidelines',
        strength: 'Strong',
      },
      sources: [niceSource],
      tags: ['pacing', 'energy-management', 'nice-guidelines', 'me-cfs'],
      lastUpdated: new Date('2024-01-15'),
      reviewedBy: 'Clinical Content Team',
      language: 'empathetic',
      targetAudience: 'patient',
      readingLevel: 8,
      estimatedReadTime: 3,
    };

    this.content.set(pacingContent.id, pacingContent);
  }

  private loadResearchContent(): void {
    // Research on Post-Exertional Malaise
    const pemResearch: ContentSource = {
      id: 'jason-pem-2021',
      title: 'Post-exertional malaise among patients with ME/CFS',
      authors: ['Jason, L.A.', 'Sunnquist, M.', 'Brown, A.'],
      publication: 'Journal of Health Psychology',
      year: 2021,
      doi: '10.1177/1359105321993323',
      type: 'research',
      credibilityScore: 9,
      relevanceScore: 10,
    };

    this.sources.set(pemResearch.id, pemResearch);

    const pemContent: ContentItem = {
      id: 'pem-understanding',
      title: 'Understanding Post-Exertional Malaise (PEM)',
      category: 'symptoms',
      subcategory: 'post-exertional-malaise',
      content: `
        Post-Exertional Malaise (PEM) is the hallmark symptom of ME/CFS and a key feature 
        that distinguishes it from other fatigue-related conditions. Research shows that PEM 
        is not simply feeling tired after activity - it's a complex, multi-system response 
        that can significantly worsen your symptoms.

        **What is PEM?**
        PEM is the worsening of symptoms following even minor physical, cognitive, or emotional 
        exertion. This worsening can be delayed (appearing 12-72 hours after activity) and 
        can last days, weeks, or even months.

        **Common PEM Triggers:**
        - Physical activity (even light exercise or daily tasks)
        - Cognitive exertion (concentration, decision-making, reading)
        - Emotional stress (arguments, exciting events, medical appointments)
        - Sensory overload (bright lights, loud sounds, crowds)
        - Infections or other health stressors

        **PEM Symptoms May Include:**
        - Severe fatigue and weakness
        - Flu-like symptoms (sore throat, swollen glands)
        - Cognitive difficulties ("brain fog")
        - Sleep disturbances
        - Pain and muscle aches
        - Nausea and digestive issues
        - Temperature regulation problems
        - Mood changes and emotional sensitivity

        **Managing PEM:**
        The most effective way to manage PEM is prevention through careful pacing and staying 
        within your energy limits. When PEM occurs, rest is essential - both physical and 
        cognitive rest until symptoms return to baseline.

        Remember: PEM is a real, measurable physiological response. It's not "deconditioning" 
        or lack of motivation. Your body is telling you it needs more support and gentler 
        approaches to activity.
      `,
      summary: 'Research-based information about Post-Exertional Malaise, the hallmark symptom of ME/CFS.',
      evidenceLevel: {
        level: 'A',
        description: 'Strong research evidence from peer-reviewed studies',
        strength: 'Strong',
      },
      sources: [pemResearch],
      tags: ['pem', 'post-exertional-malaise', 'symptoms', 'research', 'me-cfs'],
      lastUpdated: new Date('2024-01-15'),
      reviewedBy: 'Research Team',
      language: 'empathetic',
      targetAudience: 'patient',
      readingLevel: 9,
      estimatedReadTime: 4,
    };

    this.content.set(pemContent.id, pemContent);
  }

  private loadEducationalContent(): void {
    // Long COVID research
    const longCovidSource: ContentSource = {
      id: 'davis-longcovid-2023',
      title: 'Long COVID: major findings, mechanisms and recommendations',
      authors: ['Davis, H.E.', 'McCorkell, L.', 'Vogel, J.M.', 'Topol, E.J.'],
      publication: 'Nature Reviews Microbiology',
      year: 2023,
      doi: '10.1038/s41579-022-00846-2',
      type: 'review',
      credibilityScore: 10,
      relevanceScore: 9,
    };

    this.sources.set(longCovidSource.id, longCovidSource);

    const longCovidContent: ContentItem = {
      id: 'long-covid-overview',
      title: 'Understanding Long COVID and ME/CFS Similarities',
      category: 'general',
      subcategory: 'long-covid',
      content: `
        Long COVID, also known as Post-Acute Sequelae of SARS-CoV-2 infection (PASC), 
        shares many similarities with ME/CFS. Research shows that a significant percentage 
        of Long COVID patients meet the criteria for ME/CFS, particularly those experiencing 
        post-exertional malaise.

        **Common Symptoms Between Long COVID and ME/CFS:**
        - Post-exertional malaise (PEM)
        - Severe fatigue not relieved by rest
        - Cognitive dysfunction ("brain fog")
        - Sleep disturbances
        - Orthostatic intolerance (problems with standing)
        - Temperature regulation issues
        - Headaches and muscle pain

        **Key Research Findings:**
        Recent studies suggest that Long COVID and ME/CFS may share similar underlying 
        mechanisms, including:
        - Immune system dysfunction
        - Mitochondrial impairment
        - Autonomic nervous system problems
        - Persistent inflammation
        - Microclotting and circulation issues

        **Management Approaches:**
        The management strategies that help ME/CFS patients are often beneficial for 
        Long COVID patients as well:
        - **Pacing and energy management** to prevent PEM
        - **Symptom tracking** to identify patterns and triggers
        - **Gentle, adaptive movement** rather than traditional exercise
        - **Sleep optimization** and rest prioritization
        - **Stress management** and nervous system support

        **Important Notes:**
        - Both conditions are real, physical illnesses with measurable impacts
        - Symptoms can fluctuate significantly day to day
        - Recovery timelines vary greatly between individuals
        - Pushing through symptoms typically worsens the condition
        - Professional medical support is important for both conditions

        If you're dealing with Long COVID symptoms, many of the strategies used for ME/CFS 
        management may be helpful. Always work with healthcare providers familiar with 
        post-viral conditions for the best support.
      `,
      summary: 'Evidence-based information about Long COVID and its similarities to ME/CFS, with management strategies.',
      evidenceLevel: {
        level: 'A',
        description: 'High-quality research from peer-reviewed journals',
        strength: 'Strong',
      },
      sources: [longCovidSource],
      tags: ['long-covid', 'me-cfs', 'post-viral', 'research', 'similarities'],
      lastUpdated: new Date('2024-01-15'),
      reviewedBy: 'Medical Advisory Board',
      language: 'empathetic',
      targetAudience: 'patient',
      readingLevel: 10,
      estimatedReadTime: 5,
    };

    this.content.set(longCovidContent.id, longCovidContent);
  }

  private loadAdditionalContent(): void {
    // Import and load additional content
    import('./evidence-content-data').then(({ additionalContent, researchSources }) => {
      // Add research sources
      researchSources.forEach(source => {
        this.sources.set(source.id, source);
      });

      // Add content items
      additionalContent.forEach(item => {
        this.content.set(item.id, item);
      });
    });
  }

  // Public methods for content access
  public getContent(id: string): ContentItem | undefined {
    return this.content.get(id);
  }

  public getContentByCategory(category: string): ContentItem[] {
    return Array.from(this.content.values()).filter(item => item.category === category);
  }

  public getContentByTags(tags: string[]): ContentItem[] {
    return Array.from(this.content.values()).filter(item =>
      tags.some(tag => item.tags.includes(tag))
    );
  }

  public searchContent(query: string): ContentItem[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.content.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  public getSource(id: string): ContentSource | undefined {
    return this.sources.get(id);
  }

  public getAllContent(): ContentItem[] {
    return Array.from(this.content.values());
  }

  public getContentStats(): {
    totalItems: number;
    byCategory: Record<string, number>;
    byEvidenceLevel: Record<string, number>;
    averageReadingLevel: number;
  } {
    const items = this.getAllContent();
    const byCategory: Record<string, number> = {};
    const byEvidenceLevel: Record<string, number> = {};
    let totalReadingLevel = 0;

    items.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      byEvidenceLevel[item.evidenceLevel.level] = (byEvidenceLevel[item.evidenceLevel.level] || 0) + 1;
      totalReadingLevel += item.readingLevel;
    });

    return {
      totalItems: items.length,
      byCategory,
      byEvidenceLevel,
      averageReadingLevel: totalReadingLevel / items.length,
    };
  }

  // Content validation and quality checks
  public validateContent(item: ContentItem): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!item.title || item.title.length < 5) {
      issues.push('Title is too short or missing');
    }

    if (!item.content || item.content.length < 100) {
      issues.push('Content is too short');
    }

    if (!item.sources || item.sources.length === 0) {
      issues.push('No sources provided');
    }

    if (item.readingLevel > 12) {
      issues.push('Reading level may be too high for target audience');
    }

    if (!item.lastUpdated || item.lastUpdated < new Date('2020-01-01')) {
      issues.push('Content may be outdated');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // Update content with new research
  public updateContent(id: string, updates: Partial<ContentItem>): boolean {
    const existing = this.content.get(id);
    if (!existing) return false;

    const updated = {
      ...existing,
      ...updates,
      lastUpdated: new Date(),
    };

    const validation = this.validateContent(updated);
    if (!validation.isValid) {
      console.warn(`Content validation failed for ${id}:`, validation.issues);
      return false;
    }

    this.content.set(id, updated);
    return true;
  }

  // Add new content
  public addContent(item: ContentItem): boolean {
    const validation = this.validateContent(item);
    if (!validation.isValid) {
      console.warn(`Content validation failed:`, validation.issues);
      return false;
    }

    this.content.set(item.id, item);
    return true;
  }
}

// Export singleton instance
export const contentManager = new ContentManager();

// Utility functions
export function getEvidenceBasedContent(category?: string): ContentItem[] {
  if (category) {
    return contentManager.getContentByCategory(category);
  }
  return contentManager.getAllContent();
}

export function searchEvidenceContent(query: string): ContentItem[] {
  return contentManager.searchContent(query);
}

export function getContentWithSources(id: string): {
  content: ContentItem | undefined;
  sources: ContentSource[];
} {
  const content = contentManager.getContent(id);
  const sources = content?.sources || [];
  
  return { content, sources };
}