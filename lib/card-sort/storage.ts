import type { Group } from './types';

const KEY = 'card-sort:draft';

export interface DraftState {
  unsorted: string[];
  notUsefulCount: number;
  groups: Group[];
}

export function loadDraft(): DraftState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed || !Array.isArray(parsed.unsorted) || !Array.isArray(parsed.groups)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(state: DraftState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
