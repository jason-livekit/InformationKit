import type { LinearScaleOptions, TooltipItem } from 'chart.js';

import { AnalyticsUnit_Type } from '@/components/charts/types';
import { readableNumberAsParts } from '@/lib/charts/readable-numbers';
import { readableTimeRange, readableTimestamp } from '@/lib/charts/readable-time';
import type { SelectedTimeDomain } from '@/components/charts/types';

/**
 * Generate evenly spaced time points across the time domain.
 *
 * @remarks
 * - Mainly used to populate the time axis with labels even when there are no data points.
 */
export const generateEvenlySpacedTimePoints = (
  selectedTimeDomain: SelectedTimeDomain,
  numberOfPoints: number = 10,
): number[] => {
  const [start, end] = selectedTimeDomain;
  const duration = end - start;
  const step = duration / (numberOfPoints - 1);

  return Array.from({ length: numberOfPoints }, (_, i) => start + step * i);
};

/**
 * Returns suggested min and max values for empty charts. This is mainly cosmetic and to show what
 * data range is expected.
 *
 * @see {@link https://www.chartjs.org/docs/latest/axes/#axis-range-settings}
 */
export function suggestedLimitsByUnit(
  unit: AnalyticsUnit_Type | undefined,
): Pick<LinearScaleOptions, 'suggestedMin' | 'suggestedMax'> {
  switch (unit) {
    case AnalyticsUnit_Type.Quantity:
      return { suggestedMin: 0, suggestedMax: 10 };
    case AnalyticsUnit_Type.Seconds:
      return { suggestedMin: 0, suggestedMax: 60 };
    case AnalyticsUnit_Type.Percent:
      return { suggestedMin: 0, suggestedMax: 1 };
    case AnalyticsUnit_Type.Bytes:
      return { suggestedMin: 0, suggestedMax: 1e6 };
    case AnalyticsUnit_Type.BitsPerSecond:
      return { suggestedMin: 0, suggestedMax: 1e6 };
    case AnalyticsUnit_Type.Pixels:
      return { suggestedMin: 0, suggestedMax: 2000 };
    case AnalyticsUnit_Type.FramesPerSecond:
      return { suggestedMin: 0, suggestedMax: 60 };
    case AnalyticsUnit_Type.Milliseconds:
      return { suggestedMin: 0, suggestedMax: 1000 };
    default:
      return { suggestedMin: undefined, suggestedMax: undefined };
  }
}

/**
 * Returns a tooltip title callback that formats either a single timestamp or a time range when a
 * bucket size is provided.
 */
export function createTooltipTitleCallback(
  bucketSizeMs: number | undefined,
): (context: TooltipItem<'bar'>[] | TooltipItem<'line'>[]) => string | string[] | void {
  return function (context) {
    const timestamp = context[0]?.parsed?.x;
    if (timestamp !== undefined) {
      const bucketStartTs = Number(timestamp);
      if (bucketSizeMs === undefined) {
        return readableTimestamp(bucketStartTs, {
          formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'medium',
          },
        });
      } else {
        const bucketEndTs = bucketStartTs + bucketSizeMs;
        return readableTimeRange(bucketStartTs, bucketEndTs, {
          formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'medium',
          },
        });
      }
    } else {
      return '–';
    }
  };
}

/** Returns a tooltip label and value callback that formats the value based on the unit type. */
export function createTooltipLabelAndValueCallback(
  unitType: AnalyticsUnit_Type | undefined,
): (context: TooltipItem<'bar'> | TooltipItem<'line'>) => string | string[] | void {
  return function (context) {
    const value = context.parsed?.y;
    let valueStr = '—';
    if (typeof value === 'number') {
      valueStr = readableNumberAsParts(value, {
        unit: unitType,
        formatOptions: { notation: 'standard' },
      })
        .map((part) => part.value)
        .join('');
    }

    const label = context.dataset?.label ?? '—';
    return [label, valueStr];
  };
}
