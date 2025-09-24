import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/app-layout';
import { PrivacyDashboard } from '@/components/privacy/privacy-dashboard';

export const metadata: Metadata = {
  title: 'Privacy & Data Control | Chronic Fatigue Health Tracker',
  description: 'Manage your privacy settings, exercise your GDPR rights, and control how your health data is used and shared.',
};

export default async function PrivacyPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-full">
        <PrivacyDashboard userId={session.user.id} />
      </div>
    </AppLayout>
  );
}