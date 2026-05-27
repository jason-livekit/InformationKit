import { z } from 'zod';

export const CardSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  context: z.string().optional(),
  description: z.string().optional(),
});

export const GroupSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  cardIds: z.array(z.string()),
});

export const StudyTypeSchema = z.enum(['card-sort']);
export const StudyStatusSchema = z.enum(['draft', 'open', 'closed']);

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable(),
  createdAt: z.number(),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ProjectRoleSchema = z.enum(['owner', 'member']);

export const ProjectMemberSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  role: ProjectRoleSchema,
  createdAt: z.number(),
});

export const ProjectInviteSchema = z.object({
  token: z.string().min(1),
  projectId: z.string().min(1),
  email: z.string().email(),
  role: ProjectRoleSchema,
  invitedBy: z.string().min(1),
  createdAt: z.number(),
  expiresAt: z.number(),
});

export const StudySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: StudyTypeSchema,
  status: StudyStatusSchema,
  shareSlug: z.string().min(1),
  cards: z.array(CardSchema),
  predefinedGroups: z.array(GroupSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  studyId: z.string().min(1),
  groups: z.array(GroupSchema),
  unsorted: z.array(z.string()),
  notUseful: z.array(z.string()),
  createdAt: z.number(),
  participantToken: z.string().optional(),
});

export const SubmissionInputSchema = z.object({
  groups: z.array(GroupSchema),
  unsorted: z.array(z.string()),
  notUseful: z.array(z.string()),
  participantToken: z.string().optional(),
});

export type Card = z.infer<typeof CardSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type User = z.infer<typeof UserSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type ProjectInvite = z.infer<typeof ProjectInviteSchema>;
export type Study = z.infer<typeof StudySchema>;
export type StudyStatus = z.infer<typeof StudyStatusSchema>;
export type StudyType = z.infer<typeof StudyTypeSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;
