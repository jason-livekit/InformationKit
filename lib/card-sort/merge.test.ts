import { describe, it, expect } from 'vitest';
import { mergeCardText } from './merge';

describe('mergeCardText', () => {
  it('joins labels with " & " and descriptions with a space', () => {
    expect(
      mergeCardText([
        { label: 'Agent', description: 'A realtime AI participant.' },
        { label: 'API key', description: 'Authenticates requests.' },
      ]),
    ).toEqual({
      label: 'Agent & API key',
      description: 'A realtime AI participant. Authenticates requests.',
    });
  });

  it('skips missing/empty descriptions but keeps the labels', () => {
    expect(
      mergeCardText([
        { label: 'Webhook' },
        { label: 'Ingress', description: 'Imports media.' },
      ]),
    ).toEqual({ label: 'Webhook & Ingress', description: 'Imports media.' });
  });

  it('returns an undefined description when none of the cards have one', () => {
    expect(mergeCardText([{ label: 'A' }, { label: 'B' }])).toEqual({
      label: 'A & B',
      description: undefined,
    });
  });

  it('skips empty labels so there is no dangling separator', () => {
    expect(mergeCardText([{ label: 'Trunk' }, { label: '   ' }])).toEqual({
      label: 'Trunk',
      description: undefined,
    });
  });

  it('trims surrounding whitespace before combining', () => {
    expect(
      mergeCardText([
        { label: '  Egress  ', description: '  out  ' },
        { label: 'Region', description: 'where' },
      ]),
    ).toEqual({ label: 'Egress & Region', description: 'out where' });
  });
});
