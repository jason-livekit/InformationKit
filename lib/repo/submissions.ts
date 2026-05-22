import { getKV } from './redis';
import { SubmissionSchema, type Submission, type SubmissionInput } from './schemas';
import { makeId } from './ids';

const submissionsKey = (studyId: string) => `study:${studyId}:submissions`;

export async function addSubmission(
  studyId: string,
  input: SubmissionInput,
): Promise<Submission> {
  const kv = getKV();
  const submission: Submission = SubmissionSchema.parse({
    id: makeId('sub_'),
    studyId,
    groups: input.groups.map((g) => ({
      id: g.id,
      label: (g.label ?? '').trim() || 'Untitled group',
      cardIds: [...g.cardIds],
    })),
    unsorted: [...input.unsorted],
    notUseful: [...input.notUseful],
    createdAt: Date.now(),
    participantToken: input.participantToken,
  });
  await kv.listPush(submissionsKey(studyId), JSON.stringify(submission));
  return submission;
}

export async function listSubmissions(studyId: string): Promise<Submission[]> {
  const kv = getKV();
  const raw = await kv.listRange(submissionsKey(studyId), 0, -1);
  return raw
    .map((r) => {
      try {
        const parsed = JSON.parse(r);
        return SubmissionSchema.safeParse(parsed).data ?? null;
      } catch {
        return null;
      }
    })
    .filter((s): s is Submission => s !== null);
}

export async function countSubmissions(studyId: string): Promise<number> {
  return getKV().listLen(submissionsKey(studyId));
}

export async function resetSubmissions(studyId: string): Promise<void> {
  await getKV().del(submissionsKey(studyId));
}
