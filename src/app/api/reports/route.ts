import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HealthcareReportService } from '@/lib/services/healthcare-report.service';
import { validateGenerateReportRequest } from '@/lib/types/healthcare-report.types';
import { z } from 'zod';

// GET /api/reports - Get user's healthcare reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await HealthcareReportService.getUserReports(session.user.id);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching healthcare reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate new healthcare report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedRequest = validateGenerateReportRequest(body);

    const report = await HealthcareReportService.generateReport(
      session.user.id,
      validatedRequest
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error generating healthcare report:', error);
    
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