import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrivacyService } from '@/lib/services/privacy.service';
import { validateDataDeletionRequest } from '@/lib/types/privacy.types';
import { z } from 'zod';

// POST /api/privacy/deletion - Request data deletion
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const CreateDeletionRequestSchema = z.object({
      deletionType: z.enum(['full_account', 'specific_data', 'retention_period_expired']),
      dataCategories: z.array(z.string()).optional(),
      reason: z.enum([
        'withdrawal_of_consent',
        'no_longer_necessary',
        'unlawful_processing',
        'compliance_obligation',
        'user_request'
      ]),
      reasonDescription: z.string().max(1000).optional(),
    });

    const validatedRequest = CreateDeletionRequestSchema.parse(body);

    const deletionRequest = await PrivacyService.requestDataDeletion(
      session.user.id,
      {
        deletionType: validatedRequest.deletionType,
        dataCategories: validatedRequest.dataCategories as any,
        reason: validatedRequest.reason,
        reasonDescription: validatedRequest.reasonDescription,
      }
    );

    return NextResponse.json(deletionRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating data deletion request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/privacy/deletion - Get user's deletion requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This would retrieve deletion requests from database
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching deletion requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}