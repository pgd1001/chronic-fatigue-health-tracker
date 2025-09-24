import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SymptomService } from '@/lib/db/services/symptom.service';
import { SymptomTypeSchema } from '@/lib/types/symptom.types';

// GET /api/symptoms/trends - Get symptom trends over time
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symptomType = searchParams.get('symptomType');
    const days = parseInt(searchParams.get('days') || '30');

    if (!symptomType) {
      return NextResponse.json(
        { error: 'symptomType is required' },
        { status: 400 }
      );
    }

    // Validate symptom type
    try {
      SymptomTypeSchema.parse(symptomType);
    } catch {
      return NextResponse.json(
        { error: 'Invalid symptom type' },
        { status: 400 }
      );
    }

    const trends = await SymptomService.getSymptomTrends(
      session.user.id,
      symptomType as any,
      days
    );

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error fetching symptom trends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}