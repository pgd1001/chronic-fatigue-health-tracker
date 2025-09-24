'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  Clock, 
  Users, 
  Award,
  Heart,
  Brain,
  Activity,
  Moon,
  Utensils,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { contentManager, type ContentItem, type ContentSource } from '@/lib/content/content-manager';
import { useAccessibility } from '@/lib/accessibility/accessibility-context';

interface EvidenceBasedContentProps {
  category?: string;
  showSearch?: boolean;
  maxItems?: number;
  className?: string;
}

export function EvidenceBasedContent({ 
  category, 
  showSearch = true, 
  maxItems = 10,
  className = '' 
}: EvidenceBasedContentProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { preferences, announceToScreenReader } = useAccessibility();

  useEffect(() => {
    loadContent();
  }, [selectedCategory, searchQuery]);

  const loadContent = () => {
    let items: ContentItem[];
    
    if (searchQuery) {
      items = contentManager.searchContent(searchQuery);
    } else if (selectedCategory === 'all') {
      items = contentManager.getAllContent();
    } else {
      items = contentManager.getContentByCategory(selectedCategory);
    }

    // Sort by relevance and evidence level
    items.sort((a, b) => {
      const evidenceOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      const aScore = evidenceOrder[a.evidenceLevel.level];
      const bScore = evidenceOrder[b.evidenceLevel.level];
      
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    setContent(items.slice(0, maxItems));
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
      announceToScreenReader('Content collapsed');
    } else {
      newExpanded.add(itemId);
      announceToScreenReader('Content expanded');
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pacing': return <Activity className="h-4 w-4" />;
      case 'symptoms': return <Heart className="h-4 w-4" />;
      case 'movement': return <Activity className="h-4 w-4" />;
      case 'nutrition': return <Utensils className="h-4 w-4" />;
      case 'sleep': return <Moon className="h-4 w-4" />;
      case 'general': return <Brain className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getEvidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-like formatting for better readability
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Award className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Evidence-Based Information</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Reliable, research-backed information about ME/CFS and Long COVID from trusted sources 
          including NICE guidelines and peer-reviewed research.
        </p>
      </div>

      {/* Search and Filters */}
      {showSearch && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search evidence-based content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pacing">Pacing</TabsTrigger>
                  <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                  <TabsTrigger value="movement">Movement</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                  <TabsTrigger value="sleep">Sleep</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Items */}
      <div className="space-y-4">
        {content.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No content found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          content.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              isExpanded={expandedItems.has(item.id)}
              onToggleExpanded={() => toggleExpanded(item.id)}
              getCategoryIcon={getCategoryIcon}
              getEvidenceBadgeColor={getEvidenceBadgeColor}
              formatContent={formatContent}
              preferences={preferences}
            />
          ))
        )}
      </div>

      {/* Content Stats */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Content Quality Assurance</h3>
          </div>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• All content is based on peer-reviewed research and clinical guidelines</p>
            <p>• Sources include NICE guidelines, systematic reviews, and clinical trials</p>
            <p>• Content is regularly reviewed and updated by medical professionals</p>
            <p>• Information is presented with empathy and validation for your experience</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ContentCardProps {
  item: ContentItem;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  getCategoryIcon: (category: string) => React.ReactNode;
  getEvidenceBadgeColor: (level: string) => string;
  formatContent: (text: string) => string;
  preferences: any;
}

function ContentCard({
  item,
  isExpanded,
  onToggleExpanded,
  getCategoryIcon,
  getEvidenceBadgeColor,
  formatContent,
  preferences,
}: ContentCardProps) {
  return (
    <Card className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getCategoryIcon(item.category)}
              {item.title}
            </CardTitle>
            <CardDescription>{item.summary}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getEvidenceBadgeColor(item.evidenceLevel.level)}>
              Level {item.evidenceLevel.level}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.estimatedReadTime} min read
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Grade {item.readingLevel}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {item.sources.length} source{item.sources.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: `<p>${formatContent(item.content)}</p>` 
              }}
            />

            {/* Sources */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Evidence Sources
              </h4>
              <div className="space-y-2">
                {item.sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>

            {/* Evidence Level Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Evidence Level: {item.evidenceLevel.level}</h4>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Strength:</strong> {item.evidenceLevel.strength}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.evidenceLevel.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Click to read the full evidence-based information and view sources.
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onToggleExpanded}
          className="w-full mt-4"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse content' : 'Expand content'}
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>
      </CardContent>
    </Card>
  );
}

interface SourceCardProps {
  source: ContentSource;
}

function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="bg-white p-3 rounded border text-sm">
      <div className="font-medium mb-1">{source.title}</div>
      <div className="text-muted-foreground mb-2">
        {source.authors.join(', ')} ({source.year})
      </div>
      <div className="text-muted-foreground mb-2">
        <em>{source.publication}</em>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {source.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Credibility: {source.credibilityScore}/10
          </Badge>
        </div>
        {(source.url || source.doi) && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-auto p-1"
          >
            <a
              href={source.url || `https://doi.org/${source.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}