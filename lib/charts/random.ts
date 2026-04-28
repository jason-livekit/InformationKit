/**
 * Returns a seedable random number generator. Used by mock-data.ts to produce reproducible
 * chart data for the demo page.
 *
 * @see {@link https://github.com/cprosche/mulberry32 | Source: Mulberry32}
 */
export function randomNumberGenerator(
  seed: number,
  options: { range?: { min: number; max: number }; round?: boolean } = {},
) {
  return function () {
    const range = options.range;
    const round = options.round ?? false;

    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const normalized = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return range ? mapToRange(normalized, range, round) : normalized;
  };
}

function mapToRange(value: number, range: { min: number; max: number }, round: boolean) {
  if (round) {
    const minCeiled = Math.ceil(range.min);
    const maxFloored = Math.floor(range.max);
    return Math.floor(value * (maxFloored - minCeiled) + minCeiled);
  } else {
    return value * (range.max - range.min) + range.min;
  }
}
