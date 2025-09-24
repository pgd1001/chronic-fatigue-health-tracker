import { Metadata } from 'next';
import { AccessibilitySettings } from '@/components/accessibility/accessibility-settings';

export const metadata: Metadata = {
  title: 'Accessibility Settings | CF Tracker',
  description: 'Customize accessibility features for chronic illness support including high contrast, voice guidance, and fatigue-friendly options.',
};

export default function AccessibilityPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <AccessibilitySettings />
    </main>
  );
}