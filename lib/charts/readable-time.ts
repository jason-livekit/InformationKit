import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import { durationInMs } from './time-utils';

dayjs.extend(utc);
dayjs.extend(relativeTime);

export interface TimestampFormattingOptions {
  locales?: Intl.LocalesArgument;
  formatOptions?: Intl.DateTimeFormatOptions;
  relativeTime?: boolean;
}

/**
 * Accepted timestamp formats:
 * - Number (timestamp in milliseconds — what charts use)
 * - Bigint (timestamp in nanoseconds)
 *
 * Note: in the cloud app this also supported protobuf `Timestamp` objects. The starter uses plain
 * numbers throughout, so that variant is intentionally absent.
 */
export type FormattableTimestamp = number | bigint;

export function readableTimestamp(
  timestamp: FormattableTimestamp,
  options: TimestampFormattingOptions = {},
): string {
  return readableTimestampAsParts(timestamp, options)
    .map((part) => part.value)
    .join('');
}

export function readableTimestampAsParts(
  timestamp: FormattableTimestamp,
  options: TimestampFormattingOptions = {},
): Intl.DateTimeFormatPart[] {
  const timestampInMs = normalizeTimestampMs(timestamp);
  const { locales, formatOptions, relativeTime: relative } = options;
  if (relative === true) {
    return [{ type: 'literal', value: dayjs(timestampInMs).fromNow() }];
  }

  const dateTimeFormat = new Intl.DateTimeFormat(locales ?? [], { ...formatOptions });
  return dateTimeFormat.formatToParts(timestampInMs);
}

/** Normalizes `FormattableTimestamp` to a number in milliseconds. */
export function normalizeTimestampMs(timestamp: FormattableTimestamp): number {
  switch (typeof timestamp) {
    case 'number':
      return timestamp;
    case 'bigint':
      return Number(timestamp / 1_000_000n);
    default:
      throw new Error('Invalid timestamp');
  }
}

export function getFormattingOptionsBasedOnTimeRange(
  startTs: FormattableTimestamp,
  endTs: FormattableTimestamp,
  timezone?: Intl.DateTimeFormatOptions['timeZone'],
): Intl.DateTimeFormatOptions {
  const start = normalizeTimestampMs(startTs);
  const end = normalizeTimestampMs(endTs);
  const durationMs = end - start;

  const localStart = dayjs.unix(start / 1000);
  const localEnd = dayjs.unix(end / 1000);

  const formattingOptions: Intl.DateTimeFormatOptions = { timeZone: timezone };

  if (!localStart.isSame(localEnd, 'year')) {
    formattingOptions.year = 'numeric';
  }

  if (!localStart.isSame(localEnd, 'month')) {
    formattingOptions.month = 'short';
  }

  if (!localStart.isSame(localEnd, 'day')) {
    formattingOptions.month = formattingOptions.month || 'short';
    formattingOptions.day = 'numeric';
  }

  if (durationMs < durationInMs({ minutes: 1 })) {
    formattingOptions.hour = 'numeric';
    formattingOptions.minute = 'numeric';
    formattingOptions.second = 'numeric';
  } else if (durationMs < durationInMs({ days: 7 })) {
    formattingOptions.hour = 'numeric';
    formattingOptions.minute = 'numeric';
  }
  return formattingOptions;
}

export function readableTimeRange(
  startTimestamp: FormattableTimestamp,
  endTimestamp: FormattableTimestamp,
  options: TimestampFormattingOptions = {},
): string {
  return readableTimeRangeAsParts(startTimestamp, endTimestamp, options)
    .map((part) => part.value)
    .join('');
}

export function readableTimeRangeAsParts(
  startTimestamp: FormattableTimestamp,
  endTimestamp: FormattableTimestamp,
  options: TimestampFormattingOptions = {},
): Intl.DateTimeFormatPart[] {
  const start = normalizeTimestampMs(startTimestamp);
  const end = normalizeTimestampMs(endTimestamp);

  const dateTimeFormat = new Intl.DateTimeFormat(options.locales ?? [], { ...options.formatOptions });
  return dateTimeFormat.formatRangeToParts(start, end);
}
