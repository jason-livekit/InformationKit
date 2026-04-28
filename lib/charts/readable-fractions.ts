/**
 * Splits an array of Intl.NumberFormatPart objects around the first slash character and returns
 * before and after parts without the slash.
 *
 * @example
 *
 *     const parts = [
 *       { type: 'integer', value: '1' },
 *       { type: 'unknown', value: '/' },
 *       { type: 'integer', value: '2' },
 *     ];
 *     const [before, after] = splitAroundSlash(parts);
 *     // before: [{ type: 'integer', value: '1' }]
 *     // after: [{ type: 'integer', value: '2' }]
 */
export function splitAroundSlash(
  arr: Intl.NumberFormatPart[],
): [Intl.NumberFormatPart[], Intl.NumberFormatPart[]] {
  const slashIndex = arr.findIndex((part) => part.type === 'unknown' && part.value === '/');
  return slashIndex === -1 ? [arr, []] : [arr.slice(0, slashIndex), arr.slice(slashIndex + 1)];
}

export function cleanupFractionUnits(
  parts: Intl.NumberFormatPart[],
  typeToCleanup: Intl.NumberFormatPart['type'],
) {
  const units = Array.from(parts.filter((part) => part.type === typeToCleanup).map((p) => p.value));
  const uniqueUnits = Array.from(new Set(units));
  if (uniqueUnits.length === 1) {
    const cleanedParts = parts.reduce<{ acc: Intl.NumberFormatPart[]; beforeSlash: boolean }>(
      (state, part) => {
        if (state.beforeSlash && part.type === typeToCleanup) {
          return state;
        } else if (part.type === 'unknown' && part.value === '/') {
          return { ...state, acc: [...state.acc, part], beforeSlash: false };
        } else if (state.beforeSlash && part.type === 'literal' && part.value === ' ') {
          return { ...state, acc: [...state.acc] };
        } else {
          return { ...state, acc: [...state.acc, part] };
        }
      },
      { acc: [], beforeSlash: true },
    );
    return cleanedParts.acc;
  } else {
    return parts;
  }
}

export function cleanupByteFraction(parts: Intl.NumberFormatPart[]) {
  const { units, compacts } = parts.reduce<{
    units: string[];
    compacts: string[];
  }>(
    (state, part) => {
      switch (part.type) {
        case 'unit':
          return { ...state, units: [...state.units, part.value] };
        case 'compact':
          return { ...state, compacts: [...state.compacts, part.value] };
        default:
          return state;
      }
    },
    { units: [], compacts: [] },
  );
  const uniqueUnits = new Set(units);
  const uniqueCompacts = new Set(compacts);
  if (units.length === compacts.length && uniqueUnits.size <= 1 && uniqueCompacts.size <= 1) {
    const cleanedParts = parts.reduce<{ acc: Intl.NumberFormatPart[]; beforeSlash: boolean }>(
      (state, part) => {
        if (
          state.beforeSlash &&
          (part.type === 'compact' ||
            part.type === 'unit' ||
            (part.type === 'literal' && part.value === ' '))
        ) {
          return state;
        } else if (part.type === 'unknown' && part.value === '/') {
          return { ...state, acc: [...state.acc, part], beforeSlash: false };
        } else {
          return { ...state, acc: [...state.acc, part] };
        }
      },
      { acc: [], beforeSlash: true },
    );
    return cleanedParts.acc;
  } else {
    return parts;
  }
}
