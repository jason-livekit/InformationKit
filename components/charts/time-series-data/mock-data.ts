import {
  AnalyticsUnit_Type,
  type AnalyticsScalarData,
  type AnalyticsTimeSeries,
  type AnalyticsTimeSeries_DataPoint,
} from '@/components/charts/types';
import { durationInMs } from '@/lib/charts/time-utils';
import { randomNumberGenerator } from '@/lib/charts/random';

export function genMockTimeSeries(options: {
  dataLineNames: string[];
  /** Number of data points in the chart. */
  numDataPoints?: number;
  /** Timestamp of the first data point as Unix timestamp (ms). */
  startTimestamp?: number;
  /* Time between data points in ms. */
  dataPointSpacing?: number;
  /** Seed for the random number generator. */
  seed?: number;
  /** Value Range. */
  range?: { min: number; max: number };
  /** Unit */
  unit?: AnalyticsUnit_Type;
  /** Summary value is often the average value of the time series. */
  summaryValue?: AnalyticsScalarData;
  /** Annotations */
  annotations?: { timestamp: number; label: string }[];
  /** Define the index of data points that should be undefined. */
  gaps?: { start: number; end: number }[];
  /** If set to `true`, the data points will be generated using `genDebuggingDataPoints`. */
  debugging?: boolean;
  /** Bucket size in seconds for time series data aggregation */
  bucketSizeSeconds?: number;
}): AnalyticsTimeSeries {
  const dataLineNames = options.dataLineNames || ['time_series_1', 'time_series_2'];
  const unit = options.unit || AnalyticsUnit_Type.Quantity;
  const annotations = options.annotations || [];
  const summary: AnalyticsScalarData =
    options.summaryValue ?? {
      name: 'summary',
      scalar: { case: 'floatValue', value: 33 },
      unit: { type: AnalyticsUnit_Type.Quantity },
    };
  const dataPoints = options.debugging
    ? genDebuggingDataPoints({
        dataLineNames: dataLineNames.map((name) => parseInt(name)),
        numDataPoints: options.numDataPoints ?? 10,
        startTimestamp: options.startTimestamp,
        dataPointSpacing: options.dataPointSpacing,
        seed: options.seed,
        range: options.range,
        gaps: options.gaps,
      })
    : genMockDataPoints({
        dataLineNames,
        numDataPoints: options.numDataPoints ?? 10,
        startTimestamp: options.startTimestamp,
        dataPointSpacing: options.dataPointSpacing,
        seed: options.seed,
        range: options.range,
        gaps: options.gaps,
        unit: unit,
      });

  return {
    dataPoints,
    metadata: Object.fromEntries(dataLineNames.map((name) => [name, { unit: { type: unit } }])),
    maxValue: getBiggestValue(dataPoints),
    summary,
    annotations: annotations.map((annotation) => ({
      timestamp: annotation.timestamp,
      label: annotation.label,
    })),
    bucketSizeSeconds: options.bucketSizeSeconds,
  };
}

export function genMockDataPoints(options: {
  dataLineNames: string[];
  numDataPoints?: number;
  startTimestamp?: number;
  dataPointSpacing?: number;
  seed?: number;
  range?: { min: number; max: number };
  gaps?: { start: number; end: number }[];
  unit?: AnalyticsUnit_Type;
}): AnalyticsTimeSeries_DataPoint[] {
  const dataLineNames = options.dataLineNames || ['time_series_1', 'time_series_2'];
  const startTimestamp = options.startTimestamp || 638928000000;
  const dataPointEveryXMs = options.dataPointSpacing || durationInMs({ minutes: 10 });
  const numDataPoints = options.numDataPoints;
  const seed = options.seed || 12345;
  const gaps = options.gaps || [];

  const rng = randomNumberGenerator(seed, { range: options.range });

  return new Array(numDataPoints).fill('').map((_, pointIndex) => {
    const offset = pointIndex * dataPointEveryXMs;
    const dataPointValues = dataLineNames.map((dataLineName) => ({
      timeSeriesName: dataLineName,
      value: gaps.some(({ start, end }) => pointIndex >= start && pointIndex <= end)
        ? undefined
        : options.unit === AnalyticsUnit_Type.Quantity
          ? Math.round(rng())
          : rng(),
    }));
    return {
      timestamp: startTimestamp + offset,
      values: [...dataPointValues],
    };
  });
}

function getBiggestValue(dataPoints: AnalyticsTimeSeries_DataPoint[]): number {
  return dataPoints.reduce((max, dataPoint) => {
    const values = dataPoint.values
      .map((value) => value.value)
      .filter((value) => value !== undefined);
    const biggestValue = Math.max(...(values as number[]));
    return Math.max(max, biggestValue);
  }, 0);
}

export function getDataTimeRange(timeSeries: AnalyticsTimeSeries): [number, number] {
  const timestamps = timeSeries.dataPoints.reduce((acc, dataPoint) => {
    if (dataPoint.timestamp !== undefined) {
      acc.push(dataPoint.timestamp);
    }
    return acc;
  }, [] as number[]);
  return [Math.min(...timestamps), Math.max(...timestamps)];
}

/**
 * Generates debugging data points for the time series chart. All data point values match the line
 * name. So data line 1 has only 1s, data line 2 has only 2s, etc. This is helpful to debug the time
 * series chart.
 */
export function genDebuggingDataPoints(options: {
  dataLineNames?: number[];
  numDataPoints?: number;
  startTimestamp?: number;
  dataPointSpacing?: number;
  seed?: number;
  range?: { min: number; max: number };
  gaps?: { start: number; end: number }[];
}): AnalyticsTimeSeries_DataPoint[] {
  const dataLineNames = options.dataLineNames || [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const startTimestamp = options.startTimestamp || 638928000000;
  const dataPointEveryXMs = options.dataPointSpacing || durationInMs({ minutes: 10 });
  const numDataPoints = options.numDataPoints;

  return new Array(numDataPoints).fill('').map((_, pointIndex) => {
    const offset = pointIndex * dataPointEveryXMs;
    const dataPointValues = dataLineNames.map((dataLineName) => ({
      timeSeriesName: `${dataLineName.toString()}`,
      value: dataLineName,
    }));
    return {
      timestamp: startTimestamp + offset,
      values: [...dataPointValues],
    };
  });
}
