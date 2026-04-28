
import type { AnalyticsTimeSeries } from '@/components/charts/types';

type Unpack<T> = {
  [K in keyof T]: T[K] extends object ? Unpack<T[K]> : T[K];
};

export type TimeSeries = Unpack<AnalyticsTimeSeries>;
export type Datum = Unpack<AnalyticsTimeSeries['dataPoints'][number]>;
export type TimeSeriesMetadata = Unpack<AnalyticsTimeSeries['metadata'][number]>;

export function getTimeLimits<T extends Pick<Datum, 'timestamp'>[]>(
  dataPoints: T,
): {
  min: number;
  max: number;
} {
  const firstDataPoint = dataPoints[0];
  const lastDataPoint = dataPoints[dataPoints.length - 1];
  if (firstDataPoint?.timestamp === undefined || lastDataPoint?.timestamp === undefined) {
    return {
      min: 0,
      max: 0,
    };
  }
  return {
    min: firstDataPoint.timestamp,
    max: lastDataPoint.timestamp,
  };
}

/**
 * A `AnalyticsTimeSeries_DataPoint` can hold multiple values for different time series. This
 * function returns a value accessor function to return the correct value from a data point.
 */
export function createValueAccessor(timeSeriesName: string) {
  function yAccessor(d: Datum) {
    const dataPoint = d.values.find((value) => value.timeSeriesName === timeSeriesName);
    if (dataPoint && dataPoint.value !== undefined) {
      return dataPoint.value;
    } else {
      return undefined;
    }
  }
  return yAccessor;
}

export function dataPointToXY(timeSeriesName: string) {
  function dataPointAccessor(d: Datum) {
    const dataPoint = d.values.find((value) => value.timeSeriesName === timeSeriesName);
    if (dataPoint && dataPoint.value !== undefined && d.timestamp !== undefined) {
      return { x: d.timestamp, y: dataPoint.value };
    } else {
      return undefined;
    }
  }
  return dataPointAccessor;
}
