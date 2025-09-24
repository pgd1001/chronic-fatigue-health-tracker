import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrivacyService } from '@/lib/services/privacy.service';

// GET /api/privacy/compliance - Get user's GDPR compliance status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complianceStatus = await PrivacyService.assessGDPRCompliance(session.user.id);
    return NextResponse.json(complianceStatus);
  } catch (error) {
    console.error('Error assessing GDPR compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}