import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HealthcareReportService } from '@/lib/services/healthcare-report.service';
import { PDFExportService } from '@/lib/services/pdf-export.service';
import { type ReportFormat } from '@/lib/types/healthcare-report.types';

// GET /api/reports/[reportId]/export - Export healthcare report in various formats
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as ReportFormat || 'pdf';
    const includeRawData = searchParams.get('includeRawData') === 'true';

    // Validate format
    if (!['pdf', 'json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, json, csv' },
        { status: 400 }
      );
    }

    // Get the report
    const report = await HealthcareReportService.getReport(
      params.reportId,
      session.user.id
    );

    let content: string | Blob;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        content = await PDFExportService.generatePDF(report);
        contentType = 'application/pdf';
        filename = `${report.reportTitle.replace(/\s+/g, '_')}.pdf`;
        break;
      
      case 'json':
        content = PDFExportService.generateJSON(report, includeRawData);
        contentType = 'application/json';
        filename = `${report.reportTitle.replace(/\s+/g, '_')}.json`;
        break;
      
      case 'csv':
        content = PDFExportService.generateCSV(report);
        contentType = 'text/csv';
        filename = `${report.reportTitle.replace(/\s+/g, '_')}.csv`;
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Create response with appropriate headers
    const response = new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting healthcare report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}