"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NutritionTracker } from "./nutrition-tracker";
import { HydrationTracker } from "./hydration-tracker";
import { 
  Utensils, 
  Droplets, 
  TrendingUp, 
  Calendar,
  Target,
  Apple,
  Pill,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NutritionEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  mealTime?: string;
  foods: Array<{
    name: string;
    category: string;
    isOneProductFood: boolean;
  }>;
  supplements: Array<{
    name: string;
    type: string;
    taken: boolean;
  }>;
  waterIntake: number;
  followsThousandYearRule: boolean;
  timestamp: Date;
}

interface HydrationEntry {
  amount: number;
  timestamp: Date;
  type: 'water' | 'herbal_tea' | 'electrolytes' | 'other';
}

interface NutritionDashboardProps {
  onSaveNutrition?: (entry: any) => void;
  onAddHydration?: (amount: number, type: string) => void;
  className?: string;
}

// Mock data for development
const MOCK_NUTRITION_ENTRIES: NutritionEntry[] = [
  {
    id: '1',
    mealType: 'breakfast',
    mealTime: '08:00',
    foods: [
      { name: 'Oats', category: 'grains', isOneProductFood: true },
      { name: 'Blueberries', category: 'fruits', isOneProductFood: true },
      { name: 'Almonds', category: 'nuts_seeds', isOneProductFood: true }
    ],
    supplements: [
      { name: 'Vitamin D3', type: 'vitamin_d3', taken: true },
      { name: 'Magnesium', type: 'magnesium', taken: false }
    ],
    waterIntake: 250,
    followsThousandYearRule: true,
    timestamp: new Date()
  },
  {
    id: '2',
    mealType: 'lunch',
    mealTime: '13:00',
    foods: [
      { name: 'Salmon', category: 'protein', isOneProductFood: true },
      { name: 'Spinach', category: 'vegetables', isOneProductFood: true },
      { name: 'Sweet Potato', category: 'vegetables', isOneProductFood: true }
    ],
    supplements: [],
    waterIntake: 500,
    followsThousandYearRule: true,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
  }
];

const MOCK_HYDRATION_ENTRIES: HydrationEntry[] = [
  { amount: 250, timestamp: new Date(), type: 'water' },
  { amount: 500, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'water' },
  { amount: 300, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), type: 'herbal_tea' },
  { amount: 250, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), type: 'electrolytes' }
];

export function NutritionDashboard({ 
  onSaveNutrition,
  onAddHydration,
  className 
}: NutritionDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [nutritionEntries] = useState(MOCK_NUTRITION_ENTRIES);
  const [hydrationEntries] = useState(MOCK_HYDRATION_ENTRIES);

  const handleSaveNutrition = useCallback((entry: any) => {
    console.log('Saving nutrition entry:', entry);
    onSaveNutrition?.(entry);
  }, [onSaveNutrition]);

  const handleAddHydration = useCallback((amount: number, type: string) => {
    console.log('Adding hydration:', { amount, type });
    onAddHydration?.(amount, type);
  }, [onAddHydration]);

  // Calculate daily stats
  const todayStats = {
    totalWater: hydrationEntries.reduce((sum, entry) => sum + entry.amount, 0),
    mealsLogged: nutritionEntries.length,
    oneProductCompliance: nutritionEntries.length > 0 
      ? Math.round((nutritionEntries.reduce((sum, entry) => {
          const oneProductCount = entry.foods.filter(f => f.isOneProductFood).length;
          return sum + (entry.foods.length > 0 ? oneProductCount / entry.foods.length : 0);
        }, 0) / nutritionEntries.length) * 100)
      : 0,
    supplementsTaken: nutritionEntries.reduce((sum, entry) => 
      sum + entry.supplements.filter(s => s.taken).length, 0
    ),
    supplementsTotal: nutritionEntries.reduce((sum, entry) => 
      sum + entry.supplements.length, 0
    ),
    thousandYearCompliance: nutritionEntries.length > 0
      ? Math.round((nutritionEntries.filter(e => e.followsThousandYearRule).length / nutritionEntries.length) * 100)
      : 0
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            Nutrition & Hydration Dashboard
          </CardTitle>
          <CardDescription>
            Track your nutrition following 1-Product Foods and 1,000-Year Rule principles
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="hydration" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Hydration
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Supplements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hydration</p>
                    <p className="text-2xl font-bold text-blue-600">{todayStats.totalWater}ml</p>
                  </div>
                  <Droplets className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <Badge variant={todayStats.totalWater >= 2000 ? "default" : "secondary"}>
                    {Math.round((todayStats.totalWater / 2000) * 100)}% of goal
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meals Logged</p>
                    <p className="text-2xl font-bold text-green-600">{todayStats.mealsLogged}</p>
                  </div>
                  <Utensils className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <Badge variant={todayStats.mealsLogged >= 3 ? "default" : "secondary"}>
                    {todayStats.mealsLogged >= 3 ? "Complete" : "In Progress"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">1-Product Foods</p>
                    <p className="text-2xl font-bold text-orange-600">{todayStats.oneProductCompliance}%</p>
                  </div>
                  <Apple className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2">
                  <Badge variant={todayStats.oneProductCompliance >= 80 ? "default" : "secondary"}>
                    {todayStats.oneProductCompliance >= 80 ? "Excellent" : "Good"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Supplements</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {todayStats.supplementsTaken}/{todayStats.supplementsTotal}
                    </p>
                  </div>
                  <Pill className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <Badge variant={todayStats.supplementsTaken === todayStats.supplementsTotal ? "default" : "secondary"}>
                    {todayStats.supplementsTotal > 0 
                      ? `${Math.round((todayStats.supplementsTaken / todayStats.supplementsTotal) * 100)}%`
                      : "None planned"
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Nutrition Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Meals</CardTitle>
                <CardDescription>Nutrition entries for today</CardDescription>
              </CardHeader>
              <CardContent>
                {nutritionEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No meals logged today</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setActiveTab('nutrition')}
                    >
                      Log Your First Meal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {nutritionEntries.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium capitalize">{entry.mealType}</div>
                          <div className="text-sm text-muted-foreground">{entry.mealTime}</div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.foods.slice(0, 3).map((food, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className={food.isOneProductFood ? "bg-green-100 text-green-800" : ""}
                            >
                              {food.name}
                            </Badge>
                          ))}
                          {entry.foods.length > 3 && (
                            <Badge variant="outline">+{entry.foods.length - 3} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {entry.followsThousandYearRule && (
                            <Badge variant="outline" className="text-xs">1,000-Year Rule ✓</Badge>
                          )}
                          <span>{entry.waterIntake}ml water</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nutrition Insights</CardTitle>
                <CardDescription>Personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      🌟 <strong>Great job!</strong> You're maintaining {todayStats.oneProductCompliance}% 
                      1-Product Foods compliance today.
                    </p>
                  </div>
                  
                  {todayStats.totalWater < 1500 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💧 <strong>Hydration reminder:</strong> You're at {todayStats.totalWater}ml. 
                        Try to reach 2000ml for optimal energy and cognitive function.
                      </p>
                    </div>
                  )}
                  
                  {todayStats.supplementsTaken < todayStats.supplementsTotal && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        💊 <strong>Supplement reminder:</strong> You have {todayStats.supplementsTotal - todayStats.supplementsTaken} 
                        supplements remaining for today.
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      🥗 <strong>ME/CFS Tip:</strong> Focus on nutrient-dense, easily digestible foods. 
                      The 1-Product Foods approach reduces digestive burden while maximizing nutrition.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionTracker onSave={handleSaveNutrition} />
        </TabsContent>

        <TabsContent value="hydration">
          <HydrationTracker
            dailyGoal={2000}
            currentIntake={todayStats.totalWater}
            entries={hydrationEntries}
            onAddIntake={handleAddHydration}
          />
        </TabsContent>

        <TabsContent value="supplements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplement Tracking</CardTitle>
              <CardDescription>
                Key supplements for ME/CFS and Long COVID support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Recommended Core Supplements
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li>• <strong>Magnesium (400mg):</strong> Evening - supports sleep and muscle function</li>
                    <li>• <strong>Vitamin D3 (2000 IU):</strong> Morning - immune support and energy</li>
                    <li>• <strong>Iodine (150mcg):</strong> Morning - thyroid and metabolic support</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Additional Considerations
                  </h4>
                  <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                    <li>• <strong>B-Complex:</strong> Energy metabolism support</li>
                    <li>• <strong>Omega-3:</strong> Anti-inflammatory effects</li>
                    <li>• <strong>CoQ10:</strong> Mitochondrial support</li>
                    <li>• <strong>Probiotics:</strong> Gut health and immune function</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ <strong>Important:</strong> Always consult with your healthcare provider before starting 
                    new supplements, especially if you have chronic illness or take medications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}