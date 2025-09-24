import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvidenceBasedContent } from './evidence-based-content';
import { AccessibilityProvider } from '@/lib/accessibility/accessibility-context';

// Mock the content manager
vi.mock('@/lib/content/content-manager', () => ({
  contentManager: {
    getAllContent: vi.fn(() => [
      {
        id: 'test-content-1',
        title: 'Test Content 1',
        category: 'pacing',
        content: 'This is test content about pacing strategies.',
        summary: 'Test summary about pacing',
        evidenceLevel: {
          level: 'A',
          description: 'Strong evidence',
          strength: 'Strong',
        },
        sources: [{
          id: 'test-source-1',
          title: 'Test Source 1',
          authors: ['Test Author'],
          publication: 'Test Journal',
          year: 2023,
          type: 'research',
          credibilityScore: 9,
          relevanceScore: 10,
        }],
        tags: ['pacing', 'test'],
        lastUpdated: new Date('2024-01-15'),
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 8,
        estimatedReadTime: 3,
      },
      {
        id: 'test-content-2',
        title: 'Test Content 2',
        category: 'symptoms',
        content: 'This is test content about symptom management.',
        summary: 'Test summary about symptoms',
        evidenceLevel: {
          level: 'B',
          description: 'Moderate evidence',
          strength: 'Moderate',
        },
        sources: [{
          id: 'test-source-2',
          title: 'Test Source 2',
          authors: ['Another Author'],
          publication: 'Another Journal',
          year: 2023,
          type: 'guideline',
          credibilityScore: 10,
          relevanceScore: 9,
        }],
        tags: ['symptoms', 'test'],
        lastUpdated: new Date('2024-01-15'),
        language: 'empathetic',
        targetAudience: 'patient',
        readingLevel: 9,
        estimatedReadTime: 4,
      },
    ]),
    getContentByCategory: vi.fn((category) => {
      const allContent = [
        {
          id: 'test-content-1',
          title: 'Test Content 1',
          category: 'pacing',
          content: 'This is test content about pacing strategies.',
          summary: 'Test summary about pacing',
          evidenceLevel: { level: 'A', description: 'Strong evidence', strength: 'Strong' },
          sources: [{ id: 'test-source-1', title: 'Test Source 1', authors: ['Test Author'], publication: 'Test Journal', year: 2023, type: 'research', credibilityScore: 9, relevanceScore: 10 }],
          tags: ['pacing', 'test'],
          lastUpdated: new Date('2024-01-15'),
          language: 'empathetic',
          targetAudience: 'patient',
          readingLevel: 8,
          estimatedReadTime: 3,
        },
      ];
      return allContent.filter(item => item.category === category);
    }),
    searchContent: vi.fn((query) => {
      const allContent = [
        {
          id: 'test-content-1',
          title: 'Test Content 1',
          category: 'pacing',
          content: 'This is test content about pacing strategies.',
          summary: 'Test summary about pacing',
          evidenceLevel: { level: 'A', description: 'Strong evidence', strength: 'Strong' },
          sources: [{ id: 'test-source-1', title: 'Test Source 1', authors: ['Test Author'], publication: 'Test Journal', year: 2023, type: 'research', credibilityScore: 9, relevanceScore: 10 }],
          tags: ['pacing', 'test'],
          lastUpdated: new Date('2024-01-15'),
          language: 'empathetic',
          targetAudience: 'patient',
          readingLevel: 8,
          estimatedReadTime: 3,
        },
      ];
      return allContent.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase())
      );
    }),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderWithProvider(component: React.ReactElement) {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
}

describe('EvidenceBasedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders evidence-based content component', () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    expect(screen.getByText('Evidence-Based Information')).toBeInTheDocument();
    expect(screen.getByText(/reliable, research-backed information/i)).toBeInTheDocument();
  });

  it('displays content items', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
      expect(screen.getByText('Test Content 2')).toBeInTheDocument();
    });
  });

  it('shows evidence level badges', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Level A')).toBeInTheDocument();
      expect(screen.getByText('Level B')).toBeInTheDocument();
    });
  });

  it('displays content metadata', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('3 min read')).toBeInTheDocument();
      expect(screen.getByText('Grade 8')).toBeInTheDocument();
      expect(screen.getByText('1 source')).toBeInTheDocument();
    });
  });

  it('allows expanding and collapsing content', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
    });

    const readMoreButton = screen.getAllByText('Read More')[0];
    fireEvent.click(readMoreButton);

    await waitFor(() => {
      expect(screen.getByText('This is test content about pacing strategies.')).toBeInTheDocument();
      expect(screen.getByText('Evidence Sources')).toBeInTheDocument();
    });

    const showLessButton = screen.getByText('Show Less');
    fireEvent.click(showLessButton);

    await waitFor(() => {
      expect(screen.queryByText('This is test content about pacing strategies.')).not.toBeInTheDocument();
    });
  });

  it('filters content by category', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    const pacingTab = screen.getByRole('tab', { name: 'Pacing' });
    fireEvent.click(pacingTab);

    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Content 2')).not.toBeInTheDocument();
    });
  });

  it('searches content', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    const searchInput = screen.getByPlaceholderText('Search evidence-based content...');
    fireEvent.change(searchInput, { target: { value: 'pacing' } });

    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Content 2')).not.toBeInTheDocument();
    });
  });

  it('shows no content message when no results', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    const searchInput = screen.getByPlaceholderText('Search evidence-based content...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No content found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or category filter.')).toBeInTheDocument();
    });
  });

  it('displays source information when expanded', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
    });

    const readMoreButton = screen.getAllByText('Read More')[0];
    fireEvent.click(readMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Test Source 1')).toBeInTheDocument();
      expect(screen.getByText('Test Author (2023)')).toBeInTheDocument();
      expect(screen.getByText('Test Journal')).toBeInTheDocument();
      expect(screen.getByText('Credibility: 9/10')).toBeInTheDocument();
    });
  });

  it('shows evidence level details when expanded', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
    });

    const readMoreButton = screen.getAllByText('Read More')[0];
    fireEvent.click(readMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Evidence Level: A')).toBeInTheDocument();
      expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
      expect(screen.getByText('Strong evidence')).toBeInTheDocument();
    });
  });

  it('displays content quality assurance information', () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    expect(screen.getByText('Content Quality Assurance')).toBeInTheDocument();
    expect(screen.getByText(/all content is based on peer-reviewed research/i)).toBeInTheDocument();
    expect(screen.getByText(/sources include NICE guidelines/i)).toBeInTheDocument();
  });

  it('respects maxItems prop', async () => {
    renderWithProvider(<EvidenceBasedContent maxItems={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Content 2')).not.toBeInTheDocument();
    });
  });

  it('can hide search when showSearch is false', () => {
    renderWithProvider(<EvidenceBasedContent showSearch={false} />);
    
    expect(screen.queryByPlaceholderText('Search evidence-based content...')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithProvider(<EvidenceBasedContent className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      const readMoreButtons = screen.getAllByText('Read More');
      readMoreButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  it('announces content changes to screen readers', async () => {
    renderWithProvider(<EvidenceBasedContent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Content 1')).toBeInTheDocument();
    });

    const readMoreButton = screen.getAllByText('Read More')[0];
    fireEvent.click(readMoreButton);

    // Check that aria-expanded changes
    await waitFor(() => {
      expect(readMoreButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});