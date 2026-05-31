import { describe, it, expect } from 'vitest';
import {
  CardSchema,
  GroupSchema,
  UserSchema,
  ProjectSchema,
  StudySchema,
  SubmissionSchema,
  StudyStatusSchema,
} from './schemas';

describe('CardSchema', () => {
  it('accepts a card with id + label', () => {
    expect(() => CardSchema.parse({ id: 'a', label: 'Apple' })).not.toThrow();
  });
  it('accepts an optional context', () => {
    expect(() => CardSchema.parse({ id: 'a', label: 'Apple', context: 'Fruit' })).not.toThrow();
  });
  it('accepts an optional description', () => {
    expect(() =>
      CardSchema.parse({ id: 'a', label: 'Apple', description: 'A round red fruit.' }),
    ).not.toThrow();
  });
  it('rejects an empty id', () => {
    expect(() => CardSchema.parse({ id: '', label: 'x' })).toThrow();
  });
  it('rejects a missing label', () => {
    expect(() => CardSchema.parse({ id: 'a' })).toThrow();
  });
});

describe('GroupSchema', () => {
  it('accepts a group with empty cards', () => {
    expect(() => GroupSchema.parse({ id: 'g', label: 'A', cardIds: [] })).not.toThrow();
  });
  it('coerces missing cardIds to []? No: rejects missing cardIds', () => {
    expect(() => GroupSchema.parse({ id: 'g', label: 'A' })).toThrow();
  });
});

describe('StudyStatusSchema', () => {
  it.each(['draft', 'open', 'closed'])('accepts %s', (s) => {
    expect(() => StudyStatusSchema.parse(s)).not.toThrow();
  });
  it('rejects anything else', () => {
    expect(() => StudyStatusSchema.parse('published')).toThrow();
  });
});

describe('UserSchema', () => {
  it('accepts a minimal user', () => {
    expect(() =>
      UserSchema.parse({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        image: null,
        createdAt: 1,
      }),
    ).not.toThrow();
  });
  it('rejects invalid emails', () => {
    expect(() =>
      UserSchema.parse({ id: 'u1', email: 'not-an-email', name: 'A', image: null, createdAt: 1 }),
    ).toThrow();
  });
});

describe('ProjectSchema', () => {
  it('accepts a valid project', () => {
    expect(() =>
      ProjectSchema.parse({
        id: 'p1',
        ownerId: 'u1',
        name: 'Pricing',
        description: '',
        createdAt: 1,
        updatedAt: 1,
      }),
    ).not.toThrow();
  });
  it('rejects an empty name', () => {
    expect(() =>
      ProjectSchema.parse({
        id: 'p1',
        ownerId: 'u1',
        name: '',
        description: '',
        createdAt: 1,
        updatedAt: 1,
      }),
    ).toThrow();
  });
});

describe('StudySchema', () => {
  const valid = {
    id: 's1',
    projectId: 'p1',
    name: 'Sort',
    description: '',
    type: 'card-sort' as const,
    status: 'draft' as const,
    shareSlug: 'abc-123',
    cards: [{ id: 'c1', label: 'One' }],
    predefinedGroups: [],
    createdAt: 1,
    updatedAt: 1,
  };
  it('accepts a valid card sort study', () => {
    expect(() => StudySchema.parse(valid)).not.toThrow();
  });
  it('defaults sortType to hybrid (pre-existing behavior) and randomizeCards to false when absent', () => {
    const parsed = StudySchema.parse(valid);
    expect(parsed.sortType).toBe('hybrid');
    expect(parsed.randomizeCards).toBe(false);
  });
  it.each(['open', 'hybrid', 'closed'] as const)('accepts sortType %s', (sortType) => {
    expect(StudySchema.parse({ ...valid, sortType }).sortType).toBe(sortType);
  });
  it('rejects an unknown sortType', () => {
    expect(() => StudySchema.parse({ ...valid, sortType: 'mixed' })).toThrow();
  });
  it('rejects an unknown study type', () => {
    expect(() => StudySchema.parse({ ...valid, type: 'survey' })).toThrow();
  });
  it('rejects a missing shareSlug', () => {
    expect(() => StudySchema.parse({ ...valid, shareSlug: '' })).toThrow();
  });
});

describe('SubmissionSchema', () => {
  it('accepts a valid submission with empty groups', () => {
    expect(() =>
      SubmissionSchema.parse({
        id: 'sub1',
        studyId: 's1',
        groups: [],
        unsorted: ['c1'],
        notUseful: [],
        createdAt: 1,
      }),
    ).not.toThrow();
  });
  it('rejects a submission missing studyId', () => {
    expect(() =>
      SubmissionSchema.parse({
        id: 'sub1',
        groups: [],
        unsorted: [],
        notUseful: [],
        createdAt: 1,
      }),
    ).toThrow();
  });
});
