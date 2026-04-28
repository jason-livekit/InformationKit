import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { durationInMs } from './time-utils';
import { normalizeTimestampMs, type FormattableTimestamp } from './readable-time';

dayjs.extend(utc);

/**
 * Return the formatting options for the time axis of a chart.
 *
 * The formatting options are based on the duration of the time range.
 */
export function getChartTimeAxisFormattingOptions(
  startTs: FormattableTimestamp,
  endTs: FormattableTimestamp,
  timezone?: Intl.DateTimeFormatOptions['timeZone'],
): Intl.DateTimeFormatOptions {
  const start = normalizeTimestampMs(startTs);
  const end = normalizeTimestampMs(endTs);
  const durationMs = Math.abs(end - start);

  let formattingOptions: Intl.DateTimeFormatOptions = { timeZone: timezone };

  if (durationMs > durationInMs({ days: 365 * 2 })) {
    formattingOptions = { ...formattingOptions, year: 'numeric' };
  } else if (durationMs > durationInMs({ days: 365 })) {
    formattingOptions = { ...formattingOptions, day: 'numeric', month: 'short' };
    const localStart = dayjs.unix((start + 1) / 1000);
    const localEnd = dayjs.unix((end - 1) / 1000);
    if (localStart.isSame(localEnd, 'year') === false) {
      formattingOptions.year = 'numeric';
    }
  } else if (durationMs > durationInMs({ days: 5 })) {
    formattingOptions = { ...formattingOptions, day: 'numeric', month: 'short' };
  } else if (durationMs > durationInMs({ days: 2 })) {
    formattingOptions = {
      ...formattingOptions,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
    };
  } else if (durationMs > durationInMs({ minutes: 5 })) {
    formattingOptions = { ...formattingOptions, timeStyle: 'short' };
  } else {
    formattingOptions = {
      ...formattingOptions,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
  }

  return formattingOptions;
}
