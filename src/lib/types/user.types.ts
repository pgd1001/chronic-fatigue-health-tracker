import { z } from 'zod';

// User Profile Types
export const AccessibilityPreferencesSchema = z.object({
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  largeText: z.boolean().default(false),
  voiceGuidance: z.boolean().default(false),
  screenReader: z.boolean().default(false),
  keyboardNavigation: z.boolean().default(false),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  dateOfBirth: z.string().date().optional(),
  height: z.number().int().min(50).max(300).optional(), // cm
  weight: z.number().positive().max(1000).optional(), // kg
  primaryCondition: z.enum([
    'ME/CFS',
    'Long COVID',
    'Fibromyalgia',
    'POTS',
    'EDS',
    'Other'
  ]).optional(),
  diagnosisDate: z.string().date().optional(),
  timeZone: z.string().default('UTC'),
  preferredUnits: z.enum(['metric', 'imperial']).default('metric'),
  accessibilityPreferences: AccessibilityPreferencesSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserProfileSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserProfileSchema = CreateUserProfileSchema.partial();

// Type exports
export type AccessibilityPreferences = z.infer<typeof AccessibilityPreferencesSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;

// Validation functions
export const validateUserProfile = (data: unknown): UserProfile => {
  return UserProfileSchema.parse(data);
};

export const validateCreateUserProfile = (data: unknown): CreateUserProfile => {
  return CreateUserProfileSchema.parse(data);
};

export const validateUpdateUserProfile = (data: unknown): UpdateUserProfile => {
  return UpdateUserProfileSchema.parse(data);
};