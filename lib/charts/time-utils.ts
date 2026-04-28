/** Duration in milliseconds. */
export function durationInMs(
  parts: {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
    nanoseconds?: bigint;
  } = {},
): number {
  const daysInMs = (parts.days ?? 0) * 24 * 60 * 60 * 1000;
  const hoursInMs = (parts.hours ?? 0) * 60 * 60 * 1000;
  const minutesInMs = (parts.minutes ?? 0) * 60 * 1000;
  const secondsInMs = (parts.seconds ?? 0) * 1000;
  const milliseconds = parts.milliseconds ?? 0;
  const nanoseconds = parts.nanoseconds ?? 0n;
  const nanosecondsInMs = Math.round(Number(nanoseconds / 1_000_000n));

  return daysInMs + hoursInMs + minutesInMs + secondsInMs + milliseconds + nanosecondsInMs;
}
