import { auth } from '@/auth';
import { getProject } from './projects';
import { getStudy } from './studies';
import type { Project, Study, User } from './schemas';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
  }
}
export class ForbiddenError extends Error {
  constructor() {
    super('Forbidden');
  }
}
export class NotFoundError extends Error {
  constructor() {
    super('Not found');
  }
}

export async function requireSessionUser(): Promise<Pick<User, 'id'> & { email?: string | null; name?: string | null }> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function loadOwnedProject(projectId: string, ownerId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new NotFoundError();
  if (project.ownerId !== ownerId) throw new ForbiddenError();
  return project;
}

export async function loadOwnedStudy(
  studyId: string,
  ownerId: string,
): Promise<{ study: Study; project: Project }> {
  const study = await getStudy(studyId);
  if (!study) throw new NotFoundError();
  const project = await loadOwnedProject(study.projectId, ownerId);
  return { study, project };
}
