import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrivacyService } from '@/lib/services/privacy.service';
import { validateDataExportRequest } from '@/lib/types/privacy.types';
import { z } from 'zod';

// POST /api/privacy/export - Request data export
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const CreateExportRequestSchema = z.object({
      requestType: z.enum(['full_export', 'partial_export', 'specific_categories']),
      dataCategories: z.array(z.string()).optional(),
      format: z.enum(['json', 'csv', 'pdf', 'xml']),
      dateRange: z.object({
        startDate: z.string().date().optional(),
        endDate: z.string().date().optional(),
      }).optional(),
      includeMetadata: z.boolean().optional(),
    });

    const validatedRequest = CreateExportRequestSchema.parse(body);

    const exportRequest = await PrivacyService.requestDataExport(
      session.user.id,
      {
        requestType: validatedRequest.requestType,
        dataCategories: validatedRequest.dataCategories as any,
        format: validatedRequest.format,
        dateRange: validatedRequest.dateRange,
        includeMetadata: validatedRequest.includeMetadata,
      }
    );

    return NextResponse.json(exportRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating data export request:', error);
    
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

// GET /api/privacy/export - Get user's export requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This would retrieve export requests from database
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching export requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}