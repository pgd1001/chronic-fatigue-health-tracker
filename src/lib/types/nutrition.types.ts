import { z } from 'zod';

// 1-Product Food Schema (following the 1-Product Foods principle)
export const OneProductFoodSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum([
    'protein', // meat, fish, eggs
    'vegetables',
    'fruits',
    'nuts_seeds',
    'dairy',
    'grains',
    'legumes',
    'herbs_spices',
    'oils_fats',
    'other'
  ]),
  isOneProductFood: z.boolean().default(true),
  servingSize: z.string().max(50).optional(), // e.g., "1 cup", "100g"
  notes: z.string().max(200).optional(),
});

// Supplement Schema
export const SupplementSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'magnesium',
    'vitamin_d3',
    'iodine',
    'b_complex',
    'omega_3',
    'probiotics',
    'coq10',
    'ribose',
    'carnitine',
    'other'
  ]),
  dosage: z.string().max(50), // e.g., "400mg", "2000 IU"
  timing: z.enum([
    'morning',
    'afternoon',
    'evening',
    'with_meal',
    'empty_stomach',
    'as_needed'
  ]).optional(),
  taken: z.boolean().default(false),
  notes: z.string().max(200).optional(),
});

// Nutrition Log Schema
export const NutritionLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Meal information
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']),
  mealTime: z.string().optional(), // HH:MM format
  
  // Foods consumed (following 1-Product Foods principle)
  foods: z.array(OneProductFoodSchema),
  
  // Supplements taken
  supplements: z.array(SupplementSchema),
  
  // Hydration tracking
  waterIntake: z.number().int().min(0).max(5000).optional(), // ml for this meal/session
  
  // Meal quality and satisfaction
  hungerBefore: z.number().int().min(1).max(10).optional(), // 1-10 scale
  satisfactionAfter: z.number().int().min(1).max(10).optional(),
  energyAfter: z.number().int().min(1).max(10).optional(), // energy 1-2 hours after eating
  
  // Digestive response (important for chronic illness)
  digestiveComfort: z.number().int().min(1).max(10).optional(),
  bloating: z.boolean().default(false),
  nausea: z.boolean().default(false),
  
  // 1,000-Year Rule compliance
  followsThousandYearRule: z.boolean().default(true),
  
  notes: z.string().max(500).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateNutritionLogSchema = NutritionLogSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateNutritionLogSchema = CreateNutritionLogSchema.partial().omit({
  userId: true,
  date: true,
});

// Daily Nutrition Summary Schema
export const DailyNutritionSummarySchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  
  // Hydration totals
  totalWaterIntake: z.number().int().min(0), // ml
  hydrationGoalMet: z.boolean().default(false),
  
  // Supplement compliance
  supplementsPlanned: z.number().int().min(0),
  supplementsTaken: z.number().int().min(0),
  supplementComplianceRate: z.number().min(0).max(100),
  
  // Key supplements for ME/CFS
  magnesiumTaken: z.boolean().default(false),
  vitaminD3Taken: z.boolean().default(false),
  iodineTaken: z.boolean().default(false),
  
  // Meal patterns
  mealsLogged: z.number().int().min(0),
  oneProductFoodCompliance: z.number().min(0).max(100), // percentage
  thousandYearRuleCompliance: z.number().min(0).max(100),
  
  // Overall nutrition quality
  nutritionQualityScore: z.number().min(0).max(10),
  
  // Digestive health
  averageDigestiveComfort: z.number().min(1).max(10).optional(),
  digestiveIssuesReported: z.boolean().default(false),
});

// Nutrition Recommendations Schema
export const NutritionRecommendationSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().date(),
  
  recommendationType: z.enum([
    'increase_hydration',
    'supplement_reminder',
    'meal_timing',
    'food_sensitivity_check',
    'digestive_support',
    'energy_optimization'
  ]),
  
  priority: z.enum(['low', 'medium', 'high']),
  message: z.string().max(300),
  
  // Specific recommendations
  suggestedFoods: z.array(z.string()).optional(),
  suggestedSupplements: z.array(z.string()).optional(),
  hydrationTarget: z.number().int().optional(), // ml
  
  // Evidence-based rationale
  reasoning: z.string().max(200).optional(),
  
  basedOnData: z.object({
    recentHydration: z.boolean().default(false),
    supplementCompliance: z.boolean().default(false),
    digestiveIssues: z.boolean().default(false),
    energyLevels: z.boolean().default(false),
  }),
});

// Type exports
export type OneProductFood = z.infer<typeof OneProductFoodSchema>;
export type Supplement = z.infer<typeof SupplementSchema>;
export type NutritionLog = z.infer<typeof NutritionLogSchema>;
export type CreateNutritionLog = z.infer<typeof CreateNutritionLogSchema>;
export type UpdateNutritionLog = z.infer<typeof UpdateNutritionLogSchema>;
export type DailyNutritionSummary = z.infer<typeof DailyNutritionSummarySchema>;
export type NutritionRecommendation = z.infer<typeof NutritionRecommendationSchema>;

// Validation functions
export const validateNutritionLog = (data: unknown): NutritionLog => {
  return NutritionLogSchema.parse(data);
};

export const validateCreateNutritionLog = (data: unknown): CreateNutritionLog => {
  return CreateNutritionLogSchema.parse(data);
};

export const validateUpdateNutritionLog = (data: unknown): UpdateNutritionLog => {
  return UpdateNutritionLogSchema.parse(data);
};

// Helper functions
export const calculateHydrationGoal = (weight: number, activityLevel: 'low' | 'moderate' | 'high' = 'low'): number => {
  // Base calculation: 35ml per kg body weight
  let baseGoal = weight * 35;
  
  // Adjust for activity level
  const multipliers = {
    low: 1.0,
    moderate: 1.2,
    high: 1.4,
  };
  
  return Math.round(baseGoal * multipliers[activityLevel]);
};

export const isOneProductFood = (foodName: string): boolean => {
  // Simple check for common 1-product foods
  const oneProductFoods = [
    'apple', 'banana', 'chicken breast', 'salmon', 'eggs', 'spinach',
    'broccoli', 'almonds', 'walnuts', 'olive oil', 'avocado', 'sweet potato'
  ];
  
  return oneProductFoods.some(food => 
    foodName.toLowerCase().includes(food.toLowerCase())
  );
};

export const getSupplementTimingRecommendation = (supplementType: string): string => {
  const timingMap: Record<string, string> = {
    magnesium: 'evening', // helps with sleep
    vitamin_d3: 'morning', // with fat for absorption
    iodine: 'morning', // can be energizing
    b_complex: 'morning', // energizing
    omega_3: 'with_meal', // better absorption with fat
    probiotics: 'empty_stomach', // better survival
  };
  
  return timingMap[supplementType] || 'with_meal';
};

export const calculateNutritionQualityScore = (log: NutritionLog): number => {
  let score = 5; // baseline
  
  // Bonus for 1-product foods
  const oneProductCount = log.foods.filter(f => f.isOneProductFood).length;
  score += Math.min(oneProductCount * 0.5, 2);
  
  // Bonus for following 1,000-year rule
  if (log.followsThousandYearRule) score += 1;
  
  // Bonus for good digestive response
  if (log.digestiveComfort && log.digestiveComfort >= 7) score += 1;
  
  // Penalty for digestive issues
  if (log.bloating || log.nausea) score -= 1;
  
  return Math.max(1, Math.min(10, score));
};