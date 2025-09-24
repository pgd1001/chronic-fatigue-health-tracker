import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import { HealthcareReports } from '@/components/health/healthcare-reports';

export const metadata: Metadata = {
  title: 'Healthcare Provider Reports | Chronic Fatigue Health Tracker',
  description: 'Generate comprehensive health reports to share with your healthcare providers. Export data in PDF, JSON, or CSV formats with full privacy controls.',
};

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-full">
        <HealthcareReports userId={session.user.id} />
      </div>
    </AppLayout>
  );
}