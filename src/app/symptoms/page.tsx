import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import { SymptomDashboard } from '@/components/health/symptom-dashboard';

export const metadata: Metadata = {
  title: 'Symptom Tracking | Chronic Fatigue Health Tracker',
  description: 'Track your symptoms and monitor progress to better understand your condition and share insights with healthcare providers.',
};

export default async function SymptomsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-full">
        <SymptomDashboard userId={session.user.id} />
      </div>
    </AppLayout>
  );
}