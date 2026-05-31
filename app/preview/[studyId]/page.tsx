import { notFound } from 'next/navigation';
import { loadAccessibleStudy, requireSessionUser } from '@/lib/repo/access';
import { PreviewSortClient } from './preview-sort-client';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ studyId: string }>;
}) {
  const user = await requireSessionUser();
  const { studyId } = await params;
  let study;
  try {
    ({ study } = await loadAccessibleStudy(studyId, user.id));
  } catch {
    notFound();
  }
  return (
    <PreviewSortClient
      studyId={study.id}
      studyName={study.name}
      studyDescription={study.description}
      cards={study.cards}
      predefinedGroups={study.predefinedGroups}
      sortType={study.sortType ?? 'hybrid'}
      randomizeCards={study.randomizeCards ?? false}
    />
  );
}
