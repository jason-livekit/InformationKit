'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flip, offset, useFloating } from '@floating-ui/react';
import {
  chartColors,
  colorForTheme,
  type ChartTwoFaceColorName,
} from '@/colors/two-face-colors';
import { fontFamily } from '@/lib/fonts';
import { useTheme } from '@/components/bytes';
import {
  Chart,
  Colors,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  type ChartDataset,
  type ChartOptions,
  type TooltipOptions,
} from 'chart.js';
import annotationPlugin, { type AnnotationOptions } from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

import { crosshairPlugin } from './chartjs-plugins/crosshair-plugin';
import { leftGapFillerPlugin } from './chartjs-plugins/left-gap-filler-plugin';
import { patternFillPlugin } from './chartjs-plugins/pattern-fill-plugin';
import { PulsingOverlay, useLastPointMarkers } from './pulsing-overlay/PulsingOverlay';

/** Extra padding so hover points at chart edges are not clipped by the canvas boundary. */
const MAX_POINT_RADIUS = 5;

import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';


import type {
  AnalyticsTimeSeries,
  AnalyticsTimeSeries_DataPoint,
  AnalyticsUnit_Type,
} from '@/components/charts/types';
import type { SetTimeRangeCallback } from '@/components/charts/types';
import { getChartTimeAxisFormattingOptions } from '@/lib/charts/readable-chart-values';
import { readableNumber } from '@/lib/charts/readable-numbers';
import { readableTimestamp } from '@/lib/charts/readable-time';
import { durationInMs } from '@/lib/charts/time-utils';
import type { SelectedTimeDomain } from '@/components/charts/types';
import { createTooltipLabelAndValueCallback, createTooltipTitleCallback } from './chart-helper';
import { ChartTooltip, type TooltipData } from './ChartTooltip';
import { ChartLegend, htmlLegendPlugin, useLegend } from './HtmlLegend';
import { dataPointToXY, getTimeLimits } from './time-series-data/helper';

Chart.register(
  Colors,
  Tooltip,
  LineElement,
  LineController,
  LinearScale,
  Legend,
  TimeScale,
  PointElement,
  annotationPlugin,
);

const ANNOTATION_COLOR_DEFAULT = '#A44704';
const ANNOTATION_LABEL_PADDING = 2;

function createAnnotationsConfig(
  annotations: AnalyticsTimeSeries['annotations'],
  chartWidth: number,
  timeDomain: readonly [number, number],
  labelColor: string,
): Record<string, AnnotationOptions<'line' | 'label'>> {
  if (!annotations || annotations.length === 0) {
    return {};
  }

  const [startTs, endTs] = timeDomain;
  const result: Record<string, AnnotationOptions<'line' | 'label'>> = {};

  annotations.forEach((annotation, index) => {
    if (!annotation.timestamp) return;

    const xValue = annotation.timestamp;
    const lineId = `line-${index}`;
    const labelId = `label-${index}`;

    const labelWidth = 5.7 * annotation.label.length + 2 * ANNOTATION_LABEL_PADDING;
    const xPos = endTs > startTs ? ((xValue - startTs) / (endTs - startTs)) * chartWidth : 0;
    const positionX: 'start' | 'end' =
      typeof xPos === 'number' && xPos + labelWidth >= chartWidth ? 'end' : 'start';

    result[lineId] = {
      type: 'line',
      xMin: xValue,
      xMax: xValue,
      borderColor: ANNOTATION_COLOR_DEFAULT,
      borderWidth: 1,
      display: true,
    };

    result[labelId] = {
      type: 'label',
      xValue: xValue,
      yAdjust: 8 + index * 12,
      content: annotation.label.toUpperCase(),
      color: labelColor,
      backgroundColor: ANNOTATION_COLOR_DEFAULT,
      borderRadius: 2,
      padding: {
        top: ANNOTATION_LABEL_PADDING,
        right: ANNOTATION_LABEL_PADDING,
        bottom: 1,
        left: ANNOTATION_LABEL_PADDING,
      },
      position: { x: positionX, y: 'center' },
      font: {
        size: 8,
        family: 'monospace',
        weight: 'normal',
      },
      display: true,
    };
  });

  return result;
}

export function LineChart(props: {
  width: number;
  height: number | undefined;
  timeSeries: AnalyticsTimeSeries;
  timeDomain: SelectedTimeDomain | undefined;
  maxSummaryValue?: number;
  onTimeRangeChange?: SetTimeRangeCallback;
  withLeftGapFiller?: boolean;
  withMoreDataIndicator?: boolean;
  withScales?: boolean;
  withLegend?: boolean;
  withCrosshair?: boolean;
  withZoom?: boolean;
  /**
   * Snap zoom selection to nearest data points. Set to a number to only snap when there are at
   * least that many data points.
   */
  snapToDataPoint?: boolean | number;
  /** Remove layout padding and clip space for compact/sparkline usage. */
  compact?: boolean;
}) {
  const displayTicks = props.withScales ?? true;
  const dataPoints = useMemo(() => {
    return props.timeSeries.dataPoints ?? [];
  }, [props.timeSeries.dataPoints]);

  const selectedTimeDomain = useMemo(() => {
    if (props.timeDomain === undefined) {
      const timeLimits = getTimeLimits(dataPoints);
      return [timeLimits.min, timeLimits.max] as const;
    } else {
      return props.timeDomain;
    }
  }, [dataPoints, props.timeDomain]);

  const filteredDataPoints = useMemo(() => {
    const [startTs, endTs] = selectedTimeDomain;
    return dataPoints.filter((dp) => {
      if (dp.timestamp === undefined) {
        return false;
      }
      const ms = dp.timestamp;
      return ms >= startTs && ms <= endTs;
    });
  }, [dataPoints, selectedTimeDomain]);

  const unitType = Object.entries(props.timeSeries.metadata ?? {}).reduce<
    AnalyticsUnit_Type | undefined
  >((acc, [, value], _index, all) => {
    if (value.unit !== undefined) {
      if (acc !== undefined && acc !== value.unit.type) {
        const debugInfo = all.map(([datasetName, metadata]) => {
          return { datasetName: datasetName, unitType: metadata.unit?.type };
        });
        console.warn(
          `Unit type mismatch. Datasets in the graph should have the same unit type. Got:`,
          debugInfo,
        );
      }
      return value.unit.type;
    }
    return acc;
  }, undefined);

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';

  const { datasets } = useMemo<{
    datasets: ChartDataset<'line', { x: number; y: number }[]>[];
  }>(() => {
    const metadata = props.timeSeries.metadata;
    const datasetsInfo: { label: string; hexColor: string }[] = [];

    if (metadata && Object.keys(metadata).length > 0) {
      let errorDatasets = 0;
      Object.entries(metadata)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([datasetName], index) => {
          const isErrorDataset = datasetName.toLowerCase().includes('error');
          if (isErrorDataset) {
            errorDatasets += 1;
          }
          const colorOptions = Object.keys(chartColors) as unknown as keyof typeof chartColors;
          const color = isErrorDataset
            ? 'chartSerious'
            : ((colorOptions[(index - errorDatasets) % colorOptions.length] ||
                'chart1') as ChartTwoFaceColorName);

          const hexColor = colorForTheme(color, theme);

          datasetsInfo.push({
            label: datasetName,
            hexColor: hexColor,
          });
        });
    } else {
      // Single dataset case
      const hexColor = colorForTheme('chart1', theme);
      datasetsInfo.push({
        label: 'Value',
        hexColor: hexColor,
      });
    }

    const datasets = datasetsInfo.map(({ label, hexColor }) => {
      const accessor = dataPointToXY(label);
      const isSingleDataset = datasetsInfo.length === 1;

      const data = filteredDataPoints.map((row) => accessor(row)).filter((p) => p !== undefined);
      /**
       * The data set has only one data point. This is a special case where we want to render at
       * least the point. Normally we don't render the points but only the line between points.
       */
      const isSinglePoint = filteredDataPoints.length === 1;

      return {
        label,
        parsing: false as const,
        data,
        borderColor: hexColor,
        backgroundColor: isSinglePoint ? hexColor : isSingleDataset ? 'transparent' : hexColor,
        borderWidth: 1.5,
        pointRadius: isSinglePoint ? 2 : 0,
        pointStyle: 'rectRounded',
        pointHoverRadius: MAX_POINT_RADIUS,
        pointHoverBackgroundColor: 'transparent',
        pointHoverBorderColor: hexColor,
        pointHoverBorderWidth: 1.5,
        pointHoverBorderRadius: 1,
        fill: isSingleDataset ? 'origin' : false,
      };
    });

    return { datasets };
  }, [filteredDataPoints, props.timeSeries.metadata, theme]);

  const chartData = useMemo(() => ({ datasets }), [datasets]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | undefined>(undefined);

  // ---- Layout

  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | undefined>(
    undefined,
  );

  const externalTooltipHandler: TooltipOptions<'line'>['external'] = useCallback(
    (context) => {
      const { tooltip } = context;

      if (tooltip.opacity === 0) {
        setTooltipData(undefined);
        return;
      }

      if (tooltip.body && containerRef.current) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map((b, index) => {
          const datasetIndex = tooltip.dataPoints[index]?.datasetIndex ?? index;
          return {
            lines: b.lines,
            color: String(datasets[datasetIndex]?.borderColor || 'black'),
          };
        });

        setTooltipPosition(() => ({ x: tooltip.caretX, y: tooltip.caretY }));
        setTooltipData({
          title: titleLines,
          body: bodyLines,
          opacity: tooltip.opacity,
        });
      }
    },
    [datasets],
  );

  const { legendItems, onLegendItems } = useLegend();

  const chartOptions = useMemo((): ChartOptions<'line'> => {
    const font = {
      size: 11,
      family: fontFamily.mono?.join(', ') ?? 'sans-serif',
    } as const;
    const gridLineColor = colorForTheme('separator1', theme);

    const [startTs, endTs] = selectedTimeDomain;
    const timeAxisFormatOptions = getChartTimeAxisFormattingOptions(startTs, endTs);

    const bucketSizeMs = props.timeSeries.bucketSizeSeconds
      ? durationInMs({ seconds: props.timeSeries.bucketSizeSeconds })
      : undefined;

    return {
      clip: {
        top: MAX_POINT_RADIUS,
        bottom: MAX_POINT_RADIUS,
        left: MAX_POINT_RADIUS,
        right: MAX_POINT_RADIUS,
      },
      animation: false,
      layout: {
        autoPadding: false,
        padding: props.compact ? MAX_POINT_RADIUS : { right: 12, bottom: 12, top: 12, left: 12 },
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        htmlLegend: {
          display: props.withLegend === true,
          onLegendItems,
        },
        legend: {
          display: false,
        },
        crosshair: {
          enabled: props.withCrosshair ?? true,
          color: colorForTheme('fg4', theme),
        },
        leftGapFiller: {
          enabled: props.withLeftGapFiller ?? false,
        },
        patternFill: {
          enabled: !props.timeSeries.metadata || Object.keys(props.timeSeries.metadata).length <= 1,
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          callbacks: {
            title: createTooltipTitleCallback(bucketSizeMs),
            label: createTooltipLabelAndValueCallback(unitType),
          },
        },
        zoom: {
          zoom: {
            drag: {
              enabled: props.withZoom,
              drawTime: 'afterDraw',
              threshold: 5,
            },
            mode: 'x',
            onZoomComplete: ({ chart }: { chart: Chart }) => {
              const bounds = chart.getZoomedScaleBounds();
              if (props.onTimeRangeChange && bounds.x !== undefined) {
                const { min, max } = bounds.x;
                const shouldSnap = shouldSnapToDataPoints(props.snapToDataPoint, dataPoints.length);
                if (shouldSnap) {
                  const snappedMin = snapToNearestDataPoint(min, dataPoints);
                  const snappedMax = snapToNearestDataPoint(max, dataPoints);
                  if (
                    snappedMin !== undefined &&
                    snappedMax !== undefined &&
                    snappedMin !== snappedMax
                  ) {
                    props.onTimeRangeChange({
                      range: 'absolute',
                      start: snappedMin,
                      end: snappedMax,
                    });
                  }
                } else {
                  props.onTimeRangeChange({
                    range: 'absolute',
                    start: Math.round(min),
                    end: Math.round(max),
                  });
                }
              }
            },
          },
        },
        annotation: {
          common: {
            drawTime: 'afterDatasetsDraw',
          },
          annotations: createAnnotationsConfig(
            props.timeSeries.annotations,
            props.width,
            selectedTimeDomain,
            colorForTheme('bg1', theme),
          ),
        },
      },
      scales: {
        // TIME AXIS
        x: {
          type: 'time',
          display: displayTicks,
          min: selectedTimeDomain[0],
          max: selectedTimeDomain[1],
          ticks: {
            source: 'auto',
            callback: function (value) {
              return typeof value === 'number'
                ? readableTimestamp(value, { formatOptions: timeAxisFormatOptions })
                : '';
            },
            maxRotation: 0,
            minRotation: 0,
            maxTicksLimit: Math.round(props.width / 200),
            padding: 4,
            font: {
              ...font,
              family: fontFamily.sans?.join(', ') ?? 'sans-serif',
            },
          },
          grid: {
            drawOnChartArea: false,
            offset: false,
            drawTicks: true,
            tickColor: gridLineColor,
            color: gridLineColor,
          },
          border: {
            display: true,
            color: gridLineColor,
          },
        },
        y: {
          min: 0,
          display: displayTicks,
          suggestedMax: props.maxSummaryValue,
          ticks: {
            callback: function (value) {
              if (typeof value === 'number' && !isNaN(value)) {
                const label = readableNumber(value, {
                  unit: unitType,
                  formatOptions: { unitDisplay: 'short' },
                });
                return label;
              } else {
                console.warn(`Y-axis value is not a number. Got: ${value}`);
                return '';
              }
            },
            maxTicksLimit: 6,
            padding: 6,
            font: font,
          },
          grid: {
            drawTicks: false,
            color: gridLineColor,
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [
    theme,
    selectedTimeDomain,
    externalTooltipHandler,
    onLegendItems,
    unitType,
    displayTicks,
    dataPoints,
    props.timeSeries.bucketSizeSeconds,
    props.timeSeries.metadata,
    props.timeSeries.annotations,
    props.width,
    props.withLegend,
    props.withCrosshair,
    props.withLeftGapFiller,
    props.withZoom,
    props.onTimeRangeChange,
    props.snapToDataPoint,
    props.maxSummaryValue,
    props.compact,
  ]);

  const { markers: lastPointMarkers, plugin: lastPointPlugin } = useLastPointMarkers();
  const [zoomPlugin, setZoomPlugin] = useState<
    (typeof import('chartjs-plugin-zoom'))['default'] | undefined
  >(undefined);
  useEffect(() => {
    if (props.withZoom && !zoomPlugin) {
      import('chartjs-plugin-zoom').then((mod) => setZoomPlugin(() => mod.default));
    }
  }, [props.withZoom, zoomPlugin]);

  const plugins = useMemo(() => {
    const pluginList = [
      Filler,
      htmlLegendPlugin,
      crosshairPlugin,
      leftGapFillerPlugin,
      patternFillPlugin,
      lastPointPlugin,
    ];
    if (zoomPlugin) {
      pluginList.push(zoomPlugin);
    }
    return pluginList;
  }, [zoomPlugin, lastPointPlugin]);

  // Imperative chart creation removed; react-chartjs-2 manages lifecycle

  const {
    refs,
    floatingStyles,
    update: updateTooltip,
  } = useFloating({
    placement: 'bottom-start',
    middleware: [offset({ mainAxis: 16, alignmentAxis: 16 }), flip()],
  });
  const lastTooltipPosition = useRef<{ x: number; y: number } | undefined>(undefined);
  useEffect(() => {
    if (
      tooltipPosition?.x != lastTooltipPosition.current?.x ||
      tooltipPosition?.y != lastTooltipPosition.current?.y
    ) {
      lastTooltipPosition.current = tooltipPosition;
      updateTooltip();
    }
  }, [tooltipPosition, updateTooltip]);

  return (
    <div
      ref={containerRef}
      className="grid h-full max-w-full grid-rows-[minmax(0px,min-content)_minmax(0px,1fr)]"
      style={{ height: props.height }}
    >
      {props.withLegend && (
        <div className="mx-4">
          <ChartLegend legendItems={legendItems} />
        </div>
      )}

      <div className="relative row-start-2 grow">
        <div className="relative h-full" style={{ width: props.width }}>
          <Line
            data={chartData}
            options={chartOptions}
            plugins={plugins}
            className="overflow-hidden"
          />
          <PulsingOverlay
            markers={lastPointMarkers}
            enabled={props.withMoreDataIndicator ?? false}
          />
        </div>
        {/* This is the reference element for the floating tooltip. */}
        <div
          ref={refs.setReference}
          className="absolute size-0"
          style={{
            top: `${tooltipPosition?.y || 0}px`,
            left: `${tooltipPosition?.x || 0}px`,
          }}
        />
      </div>

      <ChartTooltip data={tooltipData} ref={refs.setFloating} style={floatingStyles} />
    </div>
  );
}

function shouldSnapToDataPoints(
  snapOption: boolean | number | undefined,
  dataPointCount: number,
): boolean {
  if (snapOption === undefined || snapOption === false) {
    return false;
  }
  if (snapOption === true) {
    return true;
  }
  return dataPointCount >= snapOption;
}

function snapToNearestDataPoint(
  targetMs: number,
  dataPoints: readonly AnalyticsTimeSeries_DataPoint[],
): number | undefined {
  let closestMs: number | undefined = undefined;
  let closestDistance = Infinity;

  for (const dp of dataPoints) {
    if (dp.timestamp === undefined) {
      continue;
    }
    const dpMs = dp.timestamp;
    const distance = Math.abs(dpMs - targetMs);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestMs = dpMs;
    } else {
      break;
    }
  }

  return closestMs;
}
