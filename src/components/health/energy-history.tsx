"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnergyEntry {
  id: string;
  value: number;
  timestamp: Date;
  notes?: string;
  context?: 'morning' | 'afternoon' | 'evening' | 'post_exercise' | 'post_meal' | 'other';
}

interface EnergyHistoryProps {
  entries?: EnergyEntry[];
  onExport?: () => void;
  className?: string;
}

const CONTEXT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon', 
  evening: 'Evening',
  post_exercise: 'After Exercise',
  post_meal: 'After Meal',
  other: 'Other'
};

const CONTEXT_COLORS = {
  morning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  afternoon: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  evening: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  post_exercise: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  post_meal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export function EnergyHistory({ 
  entries = [], 
  onExport,
  className 
}: EnergyHistoryProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [showStats, setShowStats] = useState(true);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeFilter) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setDate(now.getDate() - 30);
        break;
      default:
        return entries;
    }
    
    return entries.filter(entry => entry.timestamp >= cutoff);
  }, [entries, timeFilter]);

  const stats = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    
    const values = filteredEntries.map(e => e.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate trend
    const recent = filteredEntries.slice(-7);
    const older = filteredEntries.slice(-14, -7);
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, e) => sum + e.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, e) => sum + e.value, 0) / older.length;
      const difference = recentAvg - olderAvg;
      
      if (Math.abs(difference) > 0.5) {
        trend = difference > 0 ? 'improving' : 'declining';
      }
    }
    
    // Group by context
    const contextCounts = filteredEntries.reduce((acc, entry) => {
      const context = entry.context || 'other';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      average: Math.round(average * 10) / 10,
      min,
      max,
      trend,
      total: filteredEntries.length,
      contextCounts
    };
  }, [filteredEntries]);

  const getEnergyColor = (value: number): string => {
    if (value <= 3) return 'text-red-600';
    if (value <= 5) return 'text-orange-600';
    if (value <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getEnergyBg = (value: number): string => {
    if (value <= 3) return 'bg-red-50 dark:bg-red-950';
    if (value <= 5) return 'bg-orange-50 dark:bg-orange-950';
    if (value <= 7) return 'bg-yellow-50 dark:bg-yellow-950';
    return 'bg-green-50 dark:bg-green-950';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Energy History
              </CardTitle>
              <CardDescription>
                Track your energy patterns over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showStats ? 'Hide' : 'Show'} Stats
              </Button>
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
              >
                {filter === 'week' ? 'Last 7 Days' : 
                 filter === 'month' ? 'Last 30 Days' : 'All Time'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistics</CardTitle>
            <CardDescription>
              {timeFilter === 'week' ? 'Last 7 days' : 
               timeFilter === 'month' ? 'Last 30 days' : 'All time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.average}</div>
                <div className="text-sm text-muted-foreground">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Entries</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getEnergyColor(stats.min))}>
                  {stats.min}
                </div>
                <div className="text-sm text-muted-foreground">Lowest</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getEnergyColor(stats.max))}>
                  {stats.max}
                </div>
                <div className="text-sm text-muted-foreground">Highest</div>
              </div>
            </div>
            
            {/* Trend */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {stats.trend === 'improving' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : stats.trend === 'declining' ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <BarChart3 className="h-5 w-5 text-gray-600" />
              )}
              <span className={cn(
                "font-medium",
                stats.trend === 'improving' ? 'text-green-600' :
                stats.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
              )}>
                Energy is {stats.trend}
              </span>
            </div>
            
            {/* Context Distribution */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Most Common Times</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.contextCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([context, count]) => (
                    <Badge 
                      key={context}
                      variant="secondary"
                      className={CONTEXT_COLORS[context as keyof typeof CONTEXT_COLORS]}
                    >
                      {CONTEXT_LABELS[context as keyof typeof CONTEXT_LABELS]} ({count})
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Entries</CardTitle>
          <CardDescription>
            {filteredEntries.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No entries found
              </h3>
              <p className="text-sm text-muted-foreground">
                Start tracking your energy levels to see patterns over time
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      getEnergyBg(entry.value)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "text-2xl font-bold",
                          getEnergyColor(entry.value)
                        )}>
                          {entry.value}/10
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatDate(entry.timestamp)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      {entry.context && (
                        <Badge 
                          variant="secondary"
                          className={CONTEXT_COLORS[entry.context]}
                        >
                          {CONTEXT_LABELS[entry.context]}
                        </Badge>
                      )}
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}