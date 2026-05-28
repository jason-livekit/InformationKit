import type { Standardization, StandardizedCategory } from '@/lib/repo/schemas';

/**
 * Pure helpers for editing a study's {@link Standardization}. Standardization
 * merges raw participant category labels (normalized) into named canonical
 * categories. These functions never mutate their input — callers persist the
 * returned value via PATCH /api/studies/[id].
 */

export const EMPTY_STANDARDIZATION: Standardization = { categories: [] };

export function getStandardization(
  std: Standardization | undefined | null,
): Standardization {
  return std && Array.isArray(std.categories) ? std : EMPTY_STANDARDIZATION;
}

let idCounter = 0;
function newCategoryId(): string {
  // Client-side only; uniqueness within a single edit session is sufficient
  // since ids are regenerated from persisted state on reload.
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `sc_${idCounter.toString(36)}${rand}`;
}

/** All normalized labels currently claimed by any standardized category. */
export function claimedLabels(std: Standardization): Set<string> {
  const set = new Set<string>();
  for (const cat of std.categories) for (const l of cat.labels) set.add(l);
  return set;
}

/** The standardized category that owns a given normalized label, if any. */
export function categoryForLabel(
  std: Standardization,
  label: string,
): StandardizedCategory | undefined {
  return std.categories.find((c) => c.labels.includes(label));
}

/**
 * Merge a set of normalized labels into a single standardized category. Any of
 * the labels already living in other standardized categories are pulled out of
 * those and consolidated here; emptied categories are dropped.
 */
export function mergeLabels(
  std: Standardization,
  labels: string[],
  name: string,
): Standardization {
  const target = new Set(labels.filter(Boolean));
  if (target.size === 0) return std;

  // Pull the target labels out of every existing category, collecting any
  // extra labels that traveled with a category the user merged into this one.
  const merged: string[] = [...target];
  const remaining: StandardizedCategory[] = [];
  for (const cat of std.categories) {
    const keep = cat.labels.filter((l) => !target.has(l));
    const taken = cat.labels.some((l) => target.has(l));
    if (taken) {
      // The whole category is being absorbed — bring its other labels along.
      for (const l of keep) if (!merged.includes(l)) merged.push(l);
    } else if (keep.length > 0) {
      remaining.push({ ...cat, labels: keep });
    }
  }

  return {
    categories: [
      ...remaining,
      { id: newCategoryId(), name: name.trim() || 'Untitled category', labels: merged },
    ],
  };
}

/**
 * Remove the given normalized labels from standardization entirely (they revert
 * to raw, per-participant rows). Categories left empty are dropped.
 */
export function unstandardizeLabels(
  std: Standardization,
  labels: string[],
): Standardization {
  const drop = new Set(labels);
  const categories = std.categories
    .map((cat) => ({ ...cat, labels: cat.labels.filter((l) => !drop.has(l)) }))
    .filter((cat) => cat.labels.length > 0);
  return { categories };
}

/** Drop entire standardized categories by id (all their labels revert to raw). */
export function removeCategories(
  std: Standardization,
  ids: string[],
): Standardization {
  const drop = new Set(ids);
  return { categories: std.categories.filter((c) => !drop.has(c.id)) };
}

/** Rename a standardized category. */
export function renameCategory(
  std: Standardization,
  id: string,
  name: string,
): Standardization {
  return {
    categories: std.categories.map((c) =>
      c.id === id ? { ...c, name: name.trim() || c.name } : c,
    ),
  };
}
