import { notFound } from 'next/navigation';
import { ensureSeed } from '@/lib/repo/seed';
import { getStudyByShareSlug } from '@/lib/repo/studies';
import { ShareSortClient } from './share-sort-client';

export const dynamic = 'force-dynamic';

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureSeed();
  const { slug } = await params;
  const study = await getStudyByShareSlug(slug);
  if (!study || study.status === 'draft') notFound();
  return (
    <ShareSortClient
      studyId={study.id}
      studyName={study.name}
      studyDescription={study.description}
      cards={study.cards}
      predefinedGroups={study.predefinedGroups}
      sortType={study.sortType ?? 'hybrid'}
      randomizeCards={study.randomizeCards ?? false}
      closed={study.status === 'closed'}
    />
  );
}
