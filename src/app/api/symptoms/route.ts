import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SymptomService } from '@/lib/db/services/symptom.service';
import { validateSymptomEntry } from '@/lib/types/symptom.types';
import { z } from 'zod';

// Schema for creating/updating symptom logs
const CreateSymptomLogSchema = z.object({
  date: z.string().date(),
  fatigueLevel: z.number().int().min(1).max(10).optional(),
  brainFogLevel: z.number().int().min(1).max(10).optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  symptoms: z.array(z.object({
    type: z.string(),
    severity: z.number().int().min(1).max(10),
    location: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

// GET /api/symptoms - Get symptom logs for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const result = await SymptomService.getSymptomLogs(
      session.user.id,
      startDate,
      endDate,
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching symptom logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/symptoms - Create or update symptom log
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateSymptomLogSchema.parse(body);

    const result = await SymptomService.upsertSymptomLog(
      session.user.id,
      validatedData.date,
      {
        fatigueLevel: validatedData.fatigueLevel,
        brainFogLevel: validatedData.brainFogLevel,
        sleepQuality: validatedData.sleepQuality,
        symptoms: validatedData.symptoms,
        notes: validatedData.notes,
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating symptom log:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}