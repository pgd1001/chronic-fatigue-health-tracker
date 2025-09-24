import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrivacyService } from '@/lib/services/privacy.service';
import { validatePrivacySettings } from '@/lib/types/privacy.types';
import { z } from 'zod';

// GET /api/privacy/settings - Get user's privacy settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await PrivacyService.getPrivacySettings(session.user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/privacy/settings - Update user's privacy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the settings update
    const UpdatePrivacySettingsSchema = z.object({
      allowHealthcareSharing: z.boolean().optional(),
      allowAnonymizedResearch: z.boolean().optional(),
      allowAnalytics: z.boolean().optional(),
      allowMarketing: z.boolean().optional(),
      dataRetentionPeriod: z.enum(['1_year', '2_years', '5_years', 'indefinite']).optional(),
      autoDeleteInactiveData: z.boolean().optional(),
      privacyNotifications: z.boolean().optional(),
      dataBreachNotifications: z.boolean().optional(),
      policyUpdateNotifications: z.boolean().optional(),
      twoFactorRequired: z.boolean().optional(),
      sessionTimeout: z.number().int().min(15).max(480).optional(),
      allowDataExport: z.boolean().optional(),
      exportNotifications: z.boolean().optional(),
    });

    const validatedUpdates = UpdatePrivacySettingsSchema.parse(body);

    const updatedSettings = await PrivacyService.updatePrivacySettings(
      session.user.id,
      validatedUpdates
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}