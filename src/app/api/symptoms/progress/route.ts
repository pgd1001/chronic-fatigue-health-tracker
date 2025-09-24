import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SymptomService } from '@/lib/db/services/symptom.service';

// GET /api/symptoms/progress - Get progress metrics for a time period
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const progressMetrics = await SymptomService.calculateProgressMetrics(
      session.user.id,
      startDate,
      endDate
    );

    return NextResponse.json(progressMetrics);
  } catch (error) {
    console.error('Error fetching progress metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}