/** A group in the local draft. `notUsefulCount` cards at the end of `cardIds` are marked not useful. */
export interface DraftGroup {
  id: string;
  label: string;
  cardIds: string[];
  notUsefulCount: number;
}

export interface DraftState {
  unsorted: string[];
  groups: DraftGroup[];
}

const LEGACY_KEY = 'card-sort:draft';

export function loadDraft(key: string = LEGACY_KEY): DraftState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed || !Array.isArray(parsed.unsorted) || !Array.isArray(parsed.groups)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(state: DraftState, key: string = LEGACY_KEY) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearDraft(key: string = LEGACY_KEY) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
