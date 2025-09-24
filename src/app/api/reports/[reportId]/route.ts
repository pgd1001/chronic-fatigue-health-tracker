import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HealthcareReportService } from '@/lib/services/healthcare-report.service';

// GET /api/reports/[reportId] - Get specific healthcare report
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await HealthcareReportService.getReport(
      params.reportId,
      session.user.id
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching healthcare report:', error);
    return NextResponse.json(
      { error: 'Report not found' },
      { status: 404 }
    );
  }
}

// DELETE /api/reports/[reportId] - Delete healthcare report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await HealthcareReportService.deleteReport(
      params.reportId,
      session.user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting healthcare report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}