import { auth } from '@/auth';
import { getProject } from './projects';
import { getStudy } from './studies';
import { getProjectMember } from './members';
import type { Project, ProjectRole, Study, User } from './schemas';

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

/** Owner-only access. Use for operations only the owner may perform (delete project, manage members). */
export async function loadOwnedProject(projectId: string, ownerId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new NotFoundError();
  if (project.ownerId !== ownerId) throw new ForbiddenError();
  return project;
}

/**
 * Access for owners and members. Returns the project plus the caller's role.
 * Throws ForbiddenError if the user is neither the owner nor a member.
 */
export async function loadProjectAccess(
  projectId: string,
  userId: string,
): Promise<{ project: Project; role: ProjectRole }> {
  const project = await getProject(projectId);
  if (!project) throw new NotFoundError();
  if (project.ownerId === userId) return { project, role: 'owner' };
  const member = await getProjectMember(projectId, userId);
  if (member) return { project, role: member.role };
  throw new ForbiddenError();
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

/** Study access for owners and members. Returns the study, project, and the caller's role. */
export async function loadAccessibleStudy(
  studyId: string,
  userId: string,
): Promise<{ study: Study; project: Project; role: ProjectRole }> {
  const study = await getStudy(studyId);
  if (!study) throw new NotFoundError();
  const { project, role } = await loadProjectAccess(study.projectId, userId);
  return { study, project, role };
}
