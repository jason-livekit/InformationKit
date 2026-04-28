/**
 * Plain TypeScript replacements for the protobuf types in the cloud app's analytics module.
 *
 * The chart components were originally built against generated `@bufbuild/protobuf` types from
 * `cloud_analytics.proto`. To keep the prototyping-starter free of protobuf, we mirror the proto
 * shape with primitives:
 * - `Timestamp` (proto) → `number` (epoch milliseconds)
 * - `bigint` for uint64 → `number`
 * - All other fields kept structurally identical to the proto.
 *
 * If the cloud app proto shape changes, update this file accordingly.
 */

/** A unit type, mirrors `cloud_protocol.AnalyticsUnit.Type`. */
export enum AnalyticsUnit_Type {
  Quantity = 0,
  Seconds = 1,
  Percent = 2,
  Bytes = 3,
  BitsPerSecond = 4,
  Pixels = 5,
  FramesPerSecond = 6,
  Milliseconds = 7,
}

export type AnalyticsUnit = {
  type: AnalyticsUnit_Type;
};

/**
 * Simplified scalar — the proto shape supports many `case` variants (uint64Value, floatValue,
 * custom fractions, etc.). Prototypes only need the common one: a numeric value with optional unit.
 */
export type AnalyticsScalarData = {
  name: string;
  scalar:
    | { case: 'uint64Value'; value: number }
    | { case: 'floatValue'; value: number }
    | { case: 'stringValue'; value: string }
    | { case: 'boolValue'; value: boolean }
    | { case: 'timeStamp'; value: number };
  unit?: AnalyticsUnit;
};

export type AnalyticsTimeSeries_Value = {
  timeSeriesName: string;
  value?: number;
};

export type AnalyticsTimeSeries_DataPoint = {
  /** Epoch milliseconds. Was `google.protobuf.Timestamp` in the proto. */
  timestamp?: number;
  values: AnalyticsTimeSeries_Value[];
};

export type AnalyticsTimeSeries_TimeSeriesMetadata = {
  unit?: AnalyticsUnit;
};

export type AnalyticsTimeSeriesAnnotation = {
  /** Epoch milliseconds. */
  timestamp: number;
  label: string;
};

export type AnalyticsTimeSeries = {
  dataPoints: AnalyticsTimeSeries_DataPoint[];
  summary?: AnalyticsScalarData;
  metadata: { [key: string]: AnalyticsTimeSeries_TimeSeriesMetadata };
  /** Epoch milliseconds. */
  startTimestamp?: number;
  /** Epoch milliseconds. */
  endTimestamp?: number;
  /** Largest value across all data points (precomputed for chart Y-axis scaling). */
  maxValue?: number;
  annotations?: AnalyticsTimeSeriesAnnotation[];
  /** Bucket size in seconds for time series data aggregation. */
  bucketSizeSeconds?: number;
};

export type AnalyticsHistValue = {
  bucketStart: number;
  bucketEnd: number;
  count: number;
};

export type AnalyticsHistogram = {
  values: AnalyticsHistValue[];
  unitType?: AnalyticsUnit;
};

/** Selected time range as `[startEpochMs, endEpochMs]`. Mirrors the cloud-app's tuple shape. */
export type SelectedTimeDomain = readonly [number, number];

/** Time range shape passed to `SetTimeRangeCallback` (mirrors the cloud-app's `GuaranteedTimeRange`). */
export type GuaranteedTimeRange = {
  range: 'absolute' | 'relative';
  start: number;
  end: number;
};

/** Callback to update the time range, e.g. when the user pans/zooms the chart. */
export type SetTimeRangeCallback = (
  range: GuaranteedTimeRange,
  roundToNearestBucket?: boolean,
) => void;
