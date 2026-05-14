import { redirect } from 'next/navigation';
import { ensureSeed, DEMO_STUDY_ID } from '@/lib/repo/seed';

export const dynamic = 'force-dynamic';

export default async function LegacyResultsPage() {
  await ensureSeed();
  redirect(`/studies/${DEMO_STUDY_ID}?tab=analysis`);
}
