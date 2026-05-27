import { getKV } from './redis';
import { upsertUser } from './users';
import { StudySchema, ProjectSchema, SubmissionSchema } from './schemas';
import { CARDS as DEMO_CARDS } from '@/lib/card-sort/items';

export const DEMO_USER_EMAIL = 'demo@informationkit.local';
export const DEMO_STUDY_ID = 'st_demo_sessions_ui';
export const DEMO_PROJECT_ID = 'p_demo';
export const DEMO_SHARE_SLUG = 'demo-sessions-ui';

const SEED_FLAG_KEY = 'migration:done:v1';
const LEGACY_SUBMISSIONS_KEY = 'card-sort:submissions';

let seedingPromise: Promise<void> | null = null;

export async function ensureSeed(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = doSeed().catch((err) => {
      seedingPromise = null;
      throw err;
    });
  }
  return seedingPromise;
}

/** Test-only: reset the in-process seed cache so the next ensureSeed() re-runs. */
export function __resetSeedForTests(): void {
  if (process.env.NODE_ENV === 'production') return;
  seedingPromise = null;
}

async function doSeed(): Promise<void> {
  const kv = getKV();
  const flag = await kv.getString(SEED_FLAG_KEY);
  if (flag === 'true') return;

  const user = await upsertUser({
    email: DEMO_USER_EMAIL,
    name: 'Demo Owner',
    image: null,
  });

  const now = Date.now();

  if (!(await kv.jsonGet(`project:${DEMO_PROJECT_ID}`))) {
    const project = ProjectSchema.parse({
      id: DEMO_PROJECT_ID,
      ownerId: user.id,
      name: 'Demo project',
      description: 'A public example of how Information Kit organizes studies.',
      createdAt: now,
      updatedAt: now,
    });
    await kv.jsonSet(`project:${DEMO_PROJECT_ID}`, project);
    await kv.setAdd(`user:${user.id}:projects`, DEMO_PROJECT_ID);
  }

  if (!(await kv.jsonGet(`study:${DEMO_STUDY_ID}`))) {
    const study = StudySchema.parse({
      id: DEMO_STUDY_ID,
      projectId: DEMO_PROJECT_ID,
      name: 'LiveKit Cloud terminology · Information architecture',
      description:
        'Help us figure out how to group and prioritize the concepts across LiveKit Cloud.',
      type: 'card-sort',
      status: 'open',
      shareSlug: DEMO_SHARE_SLUG,
      cards: DEMO_CARDS,
      predefinedGroups: [],
      createdAt: now,
      updatedAt: now,
    });
    await kv.jsonSet(`study:${DEMO_STUDY_ID}`, study);
    await kv.listPush(`project:${DEMO_PROJECT_ID}:studies`, DEMO_STUDY_ID);
    await kv.setString(`study:byShareSlug:${DEMO_SHARE_SLUG}`, DEMO_STUDY_ID);
  }

  const legacy = await kv.listRange(LEGACY_SUBMISSIONS_KEY, 0, -1);
  if (legacy.length > 0) {
    for (const raw of legacy) {
      try {
        const obj = JSON.parse(raw) as Record<string, unknown>;
        obj.studyId = DEMO_STUDY_ID;
        const parsed = SubmissionSchema.safeParse(obj);
        if (parsed.success) {
          await kv.listPush(`study:${DEMO_STUDY_ID}:submissions`, JSON.stringify(parsed.data));
        }
      } catch {
        // skip malformed
      }
    }
    await kv.del(LEGACY_SUBMISSIONS_KEY);
  }

  await kv.setString(SEED_FLAG_KEY, 'true');
}
