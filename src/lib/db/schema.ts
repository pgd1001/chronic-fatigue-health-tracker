import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for authentication and basic profile
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User profiles with health-specific information
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  dateOfBirth: date('date_of_birth'),
  height: integer('height'), // in cm
  weight: decimal('weight', { precision: 5, scale: 2 }), // in kg
  primaryCondition: varchar('primary_condition', { length: 100 }), // ME/CFS, Long COVID, etc.
  diagnosisDate: date('diagnosis_date'),
  timeZone: varchar('time_zone', { length: 50 }).default('UTC'),
  preferredUnits: varchar('preferred_units', { length: 10 }).default('metric'), // metric/imperial
  accessibilityPreferences: jsonb('accessibility_preferences'), // high contrast, reduced motion, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Daily health logs for comprehensive tracking
export const dailyHealthLogs = pgTable('daily_health_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  energyLevel: integer('energy_level'), // 1-10 scale
  fatigueLevel: integer('fatigue_level'), // 1-10 scale
  painLevel: integer('pain_level'), // 1-10 scale
  brainFogLevel: integer('brain_fog_level'), // 1-10 scale
  sleepQuality: integer('sleep_quality'), // 1-10 scale
  sleepHours: decimal('sleep_hours', { precision: 3, scale: 1 }),
  waterIntake: integer('water_intake'), // in ml
  completedDailyAnchor: boolean('completed_daily_anchor').default(false),
  notes: text('notes'),
  symptoms: jsonb('symptoms'), // flexible symptom tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Movement sessions tracking
export const movementSessions = pgTable('movement_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  sessionType: varchar('session_type', { length: 50 }).notNull(), // warmup, resistance, flow, cooldown
  duration: integer('duration'), // in minutes
  intensity: integer('intensity'), // 1-10 scale
  exercises: jsonb('exercises'), // array of exercises performed
  preSessionEnergy: integer('pre_session_energy'), // 1-10 scale
  postSessionFatigue: integer('post_session_fatigue'), // 1-10 scale
  postSessionBreath: integer('post_session_breath'), // 1-10 scale
  postSessionStability: integer('post_session_stability'), // 1-10 scale
  adaptations: text('adaptations'), // any modifications made
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Biometric measurements from camera capture
export const biometricMeasurements = pgTable('biometric_measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  heartRate: integer('heart_rate'), // BPM
  heartRateVariability: decimal('heart_rate_variability', { precision: 6, scale: 3 }), // HRV in ms
  measurementDuration: integer('measurement_duration'), // in seconds
  quality: varchar('quality', { length: 20 }), // good, fair, poor
  rawData: jsonb('raw_data'), // for future analysis
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Nutrition and supplement tracking
export const nutritionLogs = pgTable('nutrition_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  mealType: varchar('meal_type', { length: 20 }), // breakfast, lunch, dinner, snack
  foods: jsonb('foods'), // array of 1-Product Foods
  supplements: jsonb('supplements'), // magnesium, D3, iodine, etc.
  hydration: integer('hydration'), // water intake in ml
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AI pacing recommendations and patterns
export const pacingRecommendations = pgTable('pacing_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(),
  recommendation: text('recommendation').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }), // 0.00-1.00
  basedOnData: jsonb('based_on_data'), // what data points influenced this
  userFeedback: integer('user_feedback'), // 1-5 rating of helpfulness
  applied: boolean('applied').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sleep optimization tracking
export const sleepLogs = pgTable('sleep_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  bedtime: timestamp('bedtime'),
  wakeTime: timestamp('wake_time'),
  sleepDuration: decimal('sleep_duration', { precision: 3, scale: 1 }), // hours
  sleepQuality: integer('sleep_quality'), // 1-10 scale
  bluelightReduction: boolean('bluelight_reduction').default(false),
  screenReplacement: boolean('screen_replacement').default(false),
  environmentOptimized: boolean('environment_optimized').default(false),
  supplements: jsonb('supplements'), // sleep-related supplements
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Healthcare provider reports and exports
export const healthReports = pgTable('health_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull(), // summary, detailed, specific_period
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reportData: jsonb('report_data').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  accessedAt: timestamp('accessed_at'),
  sharedWith: varchar('shared_with', { length: 255 }), // healthcare provider info
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  accessibilityPreferences: z.object({
    highContrast: z.boolean().optional(),
    reducedMotion: z.boolean().optional(),
    largeText: z.boolean().optional(),
    voiceGuidance: z.boolean().optional(),
  }).optional(),
});
export const selectUserProfileSchema = createSelectSchema(userProfiles);

export const insertDailyHealthLogSchema = createInsertSchema(dailyHealthLogs, {
  energyLevel: z.number().min(1).max(10).optional(),
  fatigueLevel: z.number().min(1).max(10).optional(),
  painLevel: z.number().min(1).max(10).optional(),
  brainFogLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  symptoms: z.array(z.string()).optional(),
});
export const selectDailyHealthLogSchema = createSelectSchema(dailyHealthLogs);

export const insertMovementSessionSchema = createInsertSchema(movementSessions, {
  intensity: z.number().min(1).max(10).optional(),
  preSessionEnergy: z.number().min(1).max(10).optional(),
  postSessionFatigue: z.number().min(1).max(10).optional(),
  postSessionBreath: z.number().min(1).max(10).optional(),
  postSessionStability: z.number().min(1).max(10).optional(),
  exercises: z.array(z.object({
    name: z.string(),
    duration: z.number().optional(),
    reps: z.number().optional(),
    sets: z.number().optional(),
  })).optional(),
});
export const selectMovementSessionSchema = createSelectSchema(movementSessions);

export const insertBiometricMeasurementSchema = createInsertSchema(biometricMeasurements);
export const selectBiometricMeasurementSchema = createSelectSchema(biometricMeasurements);

export const insertNutritionLogSchema = createInsertSchema(nutritionLogs, {
  foods: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
    oneProductFood: z.boolean().default(true),
  })).optional(),
  supplements: z.array(z.object({
    name: z.string(),
    dosage: z.string().optional(),
    timing: z.string().optional(),
  })).optional(),
});
export const selectNutritionLogSchema = createSelectSchema(nutritionLogs);

export const insertPacingRecommendationSchema = createInsertSchema(pacingRecommendations);
export const selectPacingRecommendationSchema = createSelectSchema(pacingRecommendations);

export const insertSleepLogSchema = createInsertSchema(sleepLogs);
export const selectSleepLogSchema = createSelectSchema(sleepLogs);

export const insertHealthReportSchema = createInsertSchema(healthReports);
export const selectHealthReportSchema = createSelectSchema(healthReports);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type DailyHealthLog = typeof dailyHealthLogs.$inferSelect;
export type NewDailyHealthLog = typeof dailyHealthLogs.$inferInsert;

export type MovementSession = typeof movementSessions.$inferSelect;
export type NewMovementSession = typeof movementSessions.$inferInsert;

export type BiometricMeasurement = typeof biometricMeasurements.$inferSelect;
export type NewBiometricMeasurement = typeof biometricMeasurements.$inferInsert;

export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type NewNutritionLog = typeof nutritionLogs.$inferInsert;

export type PacingRecommendation = typeof pacingRecommendations.$inferSelect;
export type NewPacingRecommendation = typeof pacingRecommendations.$inferInsert;

export type SleepLog = typeof sleepLogs.$inferSelect;
export type NewSleepLog = typeof sleepLogs.$inferInsert;

export type HealthReport = typeof healthReports.$inferSelect;
export type NewHealthReport = typeof healthReports.$inferInsert;