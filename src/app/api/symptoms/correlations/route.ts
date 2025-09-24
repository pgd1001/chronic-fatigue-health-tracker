import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SymptomService } from '@/lib/db/services/symptom.service';

// GET /api/symptoms/correlations - Get symptom correlations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const correlations = await SymptomService.analyzeSymptomCorrelations(
      session.user.id,
      days
    );

    return NextResponse.json(correlations);
  } catch (error) {
    console.error('Error fetching symptom correlations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}