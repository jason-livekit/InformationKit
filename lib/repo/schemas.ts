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

/**
 * How participants interact with the study author's predefined groups:
 * - `open`   – predefined groups are hidden; participants create every group themselves.
 * - `hybrid` – predefined groups are shown as a starting point, and participants may add more.
 * - `closed` – predefined groups are shown and fixed; participants sort into them and cannot
 *              add, rename, or remove groups.
 */
export const SortTypeSchema = z.enum(['open', 'hybrid', 'closed']);

/**
 * A standardized category groups together one or more raw participant-created
 * category labels (normalized) under a single canonical name. This powers the
 * analysis "Standardize" feature, which merges variants like "Banking", "bank",
 * and "Accounts" into one comparable category. Grouping by normalized label
 * (rather than by per-submission instance) keeps standardization stable as new
 * submissions arrive.
 */
export const StandardizedCategorySchema = z.object({
  id: z.string().min(1),
  /** Canonical display name shown across the analysis. */
  name: z.string(),
  /** Normalized raw labels merged into this standardized category. */
  labels: z.array(z.string()),
});

export const StandardizationSchema = z.object({
  categories: z.array(StandardizedCategorySchema),
});

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
  /**
   * Open / hybrid / closed. Controls whether predefined groups are shown and editable.
   * Defaults to `hybrid` — the behavior that predates this field — so existing studies
   * (and their predefined groups) keep working exactly as before.
   */
  sortType: SortTypeSchema.default('hybrid'),
  /** When true, the unsorted cards are shuffled into a random order for each participant. */
  randomizeCards: z.boolean().default(false),
  /** Analysis-time merging of participant categories. Absent until first edited. */
  standardization: StandardizationSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// --- Journey Maps -----------------------------------------------------------

/** Palette tokens a map card can be colored with. `neutral` reads from the
 *  surface tokens; the rest map to the theme-invariant raw color scales. */
export const MapColorSchema = z.enum([
  'neutral',
  'blue',
  'purple',
  'orange',
  'green',
  'red',
  'amber',
  'teal',
  'pink',
  'indigo',
]);

/** A named row. Cards live in exactly one lane and never span rows. A lane's
 *  detail level is its index in the map's `swimlanes` array (row 0 = coarsest),
 *  which drives both zoom level-of-detail and parent/child nesting. */
export const SwimlaneSchema = z.object({
  id: z.string().min(1),
  name: z.string().default(''),
});

export const MapCardKindSchema = z.enum(['card', 'data']);

export const MapVizSchema = z.enum([
  'line',
  'multiLine',
  'bars',
  'stackedBars',
  'scatter',
  'lineWithPoints',
]);

/** One series of a data card. Single-series visualizations use exactly one. */
export const MapSeriesSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(''),
  color: MapColorSchema.default('blue'),
});

/** A value at a grid column. `values` is keyed by series id so a single point
 *  can hold every series' value at that time slot (needed for stacked bars and
 *  multi-line). */
export const MapDataPointSchema = z.object({
  col: z.number().int().min(0),
  values: z.record(z.string(), z.number()),
});

export const MapCardSchema = z.object({
  id: z.string().min(1),
  kind: MapCardKindSchema.default('card'),
  laneId: z.string().min(1),
  /** Left edge on the shared base grid (0-indexed time column). */
  startCol: z.number().int().min(0),
  /** Width in base columns. Always >= 1; a card can be arbitrarily wide. */
  colSpan: z.number().int().min(1),
  /** Detail level, derived from the lane index. Cards with level <= the zoom's
   *  visible level are shown. Persisted so the value is available before the
   *  client recomputes it. */
  level: z.number().int().min(0).default(0),
  /** Id of the containing card in the lane directly above, if any. Derived. */
  parentId: z.string().nullable().default(null),
  title: z.string().default(''),
  color: MapColorSchema.default('neutral'),
  // --- Presentation (all optional; sensible fallbacks applied at render). ---
  /** Background fill treatment. `soft` is the default light tint; `solid` is a
   *  bold filled color; `none` is transparent (outline-only). */
  fillStyle: z.enum(['soft', 'solid', 'none']).optional(),
  /** Outline color. Falls back to the fill color's border tint when unset. */
  outlineColor: MapColorSchema.optional(),
  /** Outline style. Defaults to a solid border. */
  outlineStyle: z.enum(['solid', 'dashed', 'none']).optional(),
  /** Relative title size. Scales the auto-fit ceiling. Defaults to medium. */
  fontScale: z.enum(['small', 'medium', 'large']).optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  strike: z.boolean().optional(),
  /** Horizontal text alignment. Defaults to center for cards. */
  align: z.enum(['left', 'center', 'right']).optional(),
  // Data-card fields (present when kind === 'data').
  viz: MapVizSchema.optional(),
  series: z.array(MapSeriesSchema).optional(),
  points: z.array(MapDataPointSchema).optional(),
});

export const MapSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  swimlanes: z.array(SwimlaneSchema),
  cards: z.array(MapCardSchema),
  /** Total width of the grid in base columns. Kept >= the rightmost card edge. */
  columnCount: z.number().int().min(1).default(12),
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
export type StandardizedCategory = z.infer<typeof StandardizedCategorySchema>;
export type Standardization = z.infer<typeof StandardizationSchema>;
export type User = z.infer<typeof UserSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type ProjectInvite = z.infer<typeof ProjectInviteSchema>;
export type Study = z.infer<typeof StudySchema>;
export type StudyStatus = z.infer<typeof StudyStatusSchema>;
export type StudyType = z.infer<typeof StudyTypeSchema>;
export type SortType = z.infer<typeof SortTypeSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionInput = z.infer<typeof SubmissionInputSchema>;
export type MapColor = z.infer<typeof MapColorSchema>;
export type Swimlane = z.infer<typeof SwimlaneSchema>;
export type MapCardKind = z.infer<typeof MapCardKindSchema>;
export type MapViz = z.infer<typeof MapVizSchema>;
export type MapSeries = z.infer<typeof MapSeriesSchema>;
export type MapDataPoint = z.infer<typeof MapDataPointSchema>;
export type MapCard = z.infer<typeof MapCardSchema>;
export type JourneyMap = z.infer<typeof MapSchema>;
