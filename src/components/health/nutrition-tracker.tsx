"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Apple, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Droplets,
  Clock,
  Utensils
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Food {
  name: string;
  category: 'protein' | 'vegetables' | 'fruits' | 'nuts_seeds' | 'dairy' | 'grains' | 'legumes' | 'herbs_spices' | 'oils_fats' | 'other';
  isOneProductFood: boolean;
  servingSize?: string;
  notes?: string;
}

interface Supplement {
  name: string;
  type: 'magnesium' | 'vitamin_d3' | 'iodine' | 'b_complex' | 'omega_3' | 'probiotics' | 'coq10' | 'ribose' | 'carnitine' | 'other';
  dosage: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'with_meal' | 'empty_stomach' | 'as_needed';
  taken: boolean;
  notes?: string;
}

interface NutritionEntry {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  mealTime?: string;
  foods: Food[];
  supplements: Supplement[];
  waterIntake: number; // ml
  hungerBefore?: number; // 1-10 scale
  satisfactionAfter?: number; // 1-10 scale
  energyAfter?: number; // 1-10 scale
  digestiveComfort?: number; // 1-10 scale
  bloating: boolean;
  nausea: boolean;
  followsThousandYearRule: boolean;
  notes?: string;
}

interface NutritionTrackerProps {
  onSave?: (entry: NutritionEntry) => void;
  initialEntry?: Partial<NutritionEntry>;
  className?: string;
}

const FOOD_CATEGORIES = {
  protein: { label: 'Protein', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  vegetables: { label: 'Vegetables', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  fruits: { label: 'Fruits', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  nuts_seeds: { label: 'Nuts & Seeds', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  dairy: { label: 'Dairy', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  grains: { label: 'Grains', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  legumes: { label: 'Legumes', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  herbs_spices: { label: 'Herbs & Spices', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  oils_fats: { label: 'Oils & Fats', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
};

const RECOMMENDED_SUPPLEMENTS = [
  { name: 'Magnesium', type: 'magnesium' as const, defaultDosage: '400mg', timing: 'evening' as const },
  { name: 'Vitamin D3', type: 'vitamin_d3' as const, defaultDosage: '2000 IU', timing: 'morning' as const },
  { name: 'Iodine', type: 'iodine' as const, defaultDosage: '150mcg', timing: 'morning' as const },
];

const ONE_PRODUCT_FOODS = [
  'apple', 'banana', 'orange', 'berries', 'spinach', 'broccoli', 'carrots', 'sweet potato',
  'chicken breast', 'salmon', 'eggs', 'beef', 'turkey', 'almonds', 'walnuts', 'olive oil',
  'avocado', 'rice', 'oats', 'quinoa', 'lentils', 'beans', 'yogurt', 'cheese'
];

export function NutritionTracker({ 
  onSave, 
  initialEntry,
  className 
}: NutritionTrackerProps) {
  const [entry, setEntry] = useState<NutritionEntry>({
    mealType: 'breakfast',
    foods: [],
    supplements: [],
    waterIntake: 0,
    bloating: false,
    nausea: false,
    followsThousandYearRule: true,
    ...initialEntry
  });

  const [newFood, setNewFood] = useState('');
  const [newSupplement, setNewSupplement] = useState('');

  const addFood = useCallback((foodName: string) => {
    if (!foodName.trim()) return;
    
    const isOneProduct = ONE_PRODUCT_FOODS.some(food => 
      foodName.toLowerCase().includes(food.toLowerCase())
    );
    
    // Simple category detection
    let category: Food['category'] = 'other';
    const lowerName = foodName.toLowerCase();
    
    if (['chicken', 'beef', 'fish', 'salmon', 'turkey', 'eggs'].some(p => lowerName.includes(p))) {
      category = 'protein';
    } else if (['apple', 'banana', 'orange', 'berries', 'fruit'].some(f => lowerName.includes(f))) {
      category = 'fruits';
    } else if (['spinach', 'broccoli', 'carrots', 'vegetable'].some(v => lowerName.includes(v))) {
      category = 'vegetables';
    } else if (['almonds', 'walnuts', 'nuts', 'seeds'].some(n => lowerName.includes(n))) {
      category = 'nuts_seeds';
    } else if (['rice', 'oats', 'quinoa', 'bread'].some(g => lowerName.includes(g))) {
      category = 'grains';
    }
    
    const food: Food = {
      name: foodName.trim(),
      category,
      isOneProductFood: isOneProduct
    };
    
    setEntry(prev => ({
      ...prev,
      foods: [...prev.foods, food]
    }));
    
    setNewFood('');
  }, []);

  const removeFood = useCallback((index: number) => {
    setEntry(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  }, []);

  const addSupplement = useCallback((supplementName: string) => {
    if (!supplementName.trim()) return;
    
    const recommended = RECOMMENDED_SUPPLEMENTS.find(s => 
      s.name.toLowerCase() === supplementName.toLowerCase()
    );
    
    const supplement: Supplement = {
      name: supplementName.trim(),
      type: recommended?.type || 'other',
      dosage: recommended?.defaultDosage || '',
      timing: recommended?.timing || 'with_meal',
      taken: false
    };
    
    setEntry(prev => ({
      ...prev,
      supplements: [...prev.supplements, supplement]
    }));
    
    setNewSupplement('');
  }, []);

  const toggleSupplement = useCallback((index: number) => {
    setEntry(prev => ({
      ...prev,
      supplements: prev.supplements.map((sup, i) => 
        i === index ? { ...sup, taken: !sup.taken } : sup
      )
    }));
  }, []);

  const removeSupplement = useCallback((index: number) => {
    setEntry(prev => ({
      ...prev,
      supplements: prev.supplements.filter((_, i) => i !== index)
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(entry);
  }, [entry, onSave]);

  const oneProductPercentage = entry.foods.length > 0 
    ? (entry.foods.filter(f => f.isOneProductFood).length / entry.foods.length) * 100 
    : 0;

  const supplementsCompliance = entry.supplements.length > 0
    ? (entry.supplements.filter(s => s.taken).length / entry.supplements.length) * 100
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Nutrition & Hydration Tracker
          </CardTitle>
          <CardDescription>
            Following 1-Product Foods and 1,000-Year Rule principles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="mealType">Meal Type</Label>
              <select
                id="mealType"
                value={entry.mealType}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  mealType: e.target.value as NutritionEntry['mealType'] 
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="mealTime">Time</Label>
              <Input
                id="mealTime"
                type="time"
                value={entry.mealTime || ''}
                onChange={(e) => setEntry(prev => ({ ...prev, mealTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="waterIntake">Water Intake (ml)</Label>
              <Input
                id="waterIntake"
                type="number"
                value={entry.waterIntake}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  waterIntake: parseInt(e.target.value) || 0 
                }))}
                placeholder="250"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="thousandYear"
                checked={entry.followsThousandYearRule}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  followsThousandYearRule: e.target.checked 
                }))}
                className="rounded"
              />
              <Label htmlFor="thousandYear" className="text-sm">
                1,000-Year Rule
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-green-600" />
            Foods
          </CardTitle>
          <CardDescription>
            Focus on 1-Product Foods for optimal nutrition
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Food */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newFood}
              onChange={(e) => setNewFood(e.target.value)}
              placeholder="Add a food (e.g., apple, chicken breast, spinach)"
              onKeyPress={(e) => e.key === 'Enter' && addFood(newFood)}
            />
            <Button onClick={() => addFood(newFood)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Foods List */}
          <div className="space-y-2 mb-4">
            {entry.foods.map((food, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {food.isOneProductFood ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                    <span className="font-medium">{food.name}</span>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={FOOD_CATEGORIES[food.category].color}
                  >
                    {FOOD_CATEGORIES[food.category].label}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFood(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* 1-Product Foods Progress */}
          {entry.foods.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>1-Product Foods</span>
                <span>{Math.round(oneProductPercentage)}%</span>
              </div>
              <Progress value={oneProductPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Aim for 80%+ 1-Product Foods for optimal nutrition
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Supplements</CardTitle>
          <CardDescription>
            Key supplements for ME/CFS and Long COVID support
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Add Recommended */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            {RECOMMENDED_SUPPLEMENTS.map((sup) => (
              <Button
                key={sup.name}
                variant="outline"
                size="sm"
                onClick={() => addSupplement(sup.name)}
                disabled={entry.supplements.some(s => s.name === sup.name)}
              >
                <Plus className="h-3 w-3 mr-2" />
                {sup.name}
              </Button>
            ))}
          </div>
          
          {/* Add Custom Supplement */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newSupplement}
              onChange={(e) => setNewSupplement(e.target.value)}
              placeholder="Add custom supplement"
              onKeyPress={(e) => e.key === 'Enter' && addSupplement(newSupplement)}
            />
            <Button onClick={() => addSupplement(newSupplement)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Supplements List */}
          <div className="space-y-2 mb-4">
            {entry.supplements.map((supplement, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={supplement.taken}
                    onChange={() => toggleSupplement(index)}
                    className="rounded"
                  />
                  <div>
                    <span className={cn(
                      "font-medium",
                      supplement.taken ? "line-through text-muted-foreground" : ""
                    )}>
                      {supplement.name}
                    </span>
                    {supplement.dosage && (
                      <span className="text-sm text-muted-foreground ml-2">
                        {supplement.dosage}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {supplement.timing.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSupplement(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {/* Supplement Compliance */}
          {entry.supplements.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compliance Rate</span>
                <span>{Math.round(supplementsCompliance)}%</span>
              </div>
              <Progress value={supplementsCompliance} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hydration & Wellness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Hydration & Wellness Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Hunger Before (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={entry.hungerBefore || ''}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  hungerBefore: parseInt(e.target.value) || undefined 
                }))}
              />
            </div>
            
            <div>
              <Label>Satisfaction After (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={entry.satisfactionAfter || ''}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  satisfactionAfter: parseInt(e.target.value) || undefined 
                }))}
              />
            </div>
            
            <div>
              <Label>Energy After (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={entry.energyAfter || ''}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  energyAfter: parseInt(e.target.value) || undefined 
                }))}
              />
            </div>
            
            <div>
              <Label>Digestive Comfort (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={entry.digestiveComfort || ''}
                onChange={(e) => setEntry(prev => ({ 
                  ...prev, 
                  digestiveComfort: parseInt(e.target.value) || undefined 
                }))}
              />
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={entry.bloating}
                onChange={(e) => setEntry(prev => ({ ...prev, bloating: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Bloating</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={entry.nausea}
                onChange={(e) => setEntry(prev => ({ ...prev, nausea: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Nausea</span>
            </label>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={entry.notes || ''}
              onChange={(e) => setEntry(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional observations about this meal..."
              className="w-full p-3 border rounded-lg resize-none h-20 text-sm"
              maxLength={500}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Nutrition Entry
        </Button>
      </div>
    </div>
  );
}