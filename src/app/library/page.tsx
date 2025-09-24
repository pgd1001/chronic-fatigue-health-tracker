import { Metadata } from 'next';
import { EvidenceBasedContent } from '@/components/content/evidence-based-content';

export const metadata: Metadata = {
  title: 'Evidence Library | CF Tracker',
  description: 'Research-backed information about ME/CFS and Long COVID from NICE guidelines and peer-reviewed studies.',
};

export default function LibraryPage() {
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <EvidenceBasedContent showSearch={true} />
      </div>
    </main>
  );
}