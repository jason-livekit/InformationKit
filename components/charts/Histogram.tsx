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
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Colors,
  Legend,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  type ChartDataset,
  type ChartOptions,
  type TooltipOptions,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Bar } from 'react-chartjs-2';

import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';

import { AnalyticsUnit_Type, type AnalyticsTimeSeries } from '@/components/charts/types';
import type { SetTimeRangeCallback } from '@/components/charts/types';
import { getChartTimeAxisFormattingOptions } from '@/lib/charts/readable-chart-values';
import { readableNumber } from '@/lib/charts/readable-numbers';
import { readableTimestamp } from '@/lib/charts/readable-time';
import { durationInMs } from '@/lib/charts/time-utils';
import type { SelectedTimeDomain } from '@/components/charts/types';
import {
  createTooltipLabelAndValueCallback,
  createTooltipTitleCallback,
  suggestedLimitsByUnit,
} from './chart-helper';
import { lkHistogramPlugin } from './chartjs-plugins/histogram-plugin';
import { ChartTooltip, type TooltipData } from './ChartTooltip';
import { ChartLegend, htmlLegendPlugin, useLegend } from './HtmlLegend';
import { dataPointToXY, getTimeLimits } from './time-series-data/helper';

Chart.register(
  Colors,
  CategoryScale,
  Tooltip,
  BarElement,
  BarController,
  LinearScale,
  Legend,
  TimeScale,
  TimeSeriesScale,
);

export function Histogram(props: {
  width: number;
  height: number | undefined;
  timeSeries: AnalyticsTimeSeries;
  timeDomain: SelectedTimeDomain | undefined;
  maxSummaryValue?: number;
  withLeftGapFiller?: boolean;
  moreDataExpected?: boolean;
  stacked?: boolean;
  withScales?: boolean;
  withLegend?: boolean;
  withZoom?: boolean;
  onTimeRangeChange?: SetTimeRangeCallback;
}) {
  const stacked = props.stacked ?? true;
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

  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'light' ? 'light' : 'dark';
  const { datasets, unitType } = useMemo<{
    datasets: ChartDataset<'bar', ({ x: number; y: number } | null)[]>[];
    unitType: AnalyticsUnit_Type | undefined;
  }>(() => {
    const metadata = props.timeSeries.metadata;
    const datasetsInfo: {
      label: string;
      unit: AnalyticsUnit_Type;
      hexColor: string;
      isErrorDataset: boolean;
    }[] = [];
    if (metadata) {
      let errorDatasets = 0;
      Object.entries(metadata).forEach(([datasetName, metadata], index) => {
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
          unit: metadata.unit?.type ?? AnalyticsUnit_Type.Quantity,
          hexColor: hexColor,
          isErrorDataset,
        });
      });
    }
    const bg = colorForTheme('bg1', theme);
    const barHoverBg = colorForTheme('bg3', theme);
    const datasets = datasetsInfo.map(({ label, hexColor, isErrorDataset }) => {
      const accessor = dataPointToXY(label);
      const data = dataPoints.map((row) => accessor(row) ?? null);
      return {
        label,
        // parsing: false as const,
        data: data,
        barPercentage: 1,
        categoryPercentage: 1,
        // Transparency is not a viable option for us since the background lines would be visible.
        backgroundColor: bg,
        hoverBackgroundColor: `color-mix(in srgb, rgb(from ${hexColor} r g b), ${bg} 60%)`,
        minBarLength: isErrorDataset ? 0 : undefined,
        lkHistogram: {
          hexColor: hexColor,
          hoverBarBackgroundColor: barHoverBg,
        },
      };
    });

    const unitType = datasetsInfo[0]?.unit;

    return { datasets, unitType };
  }, [dataPoints, props.timeSeries.metadata, theme]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | undefined>(undefined);

  // ---- Layout

  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | undefined>(
    undefined,
  );

  const externalTooltipHandler: TooltipOptions<'bar'>['external'] = useCallback(
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
            // @ts-expect-error lkHistogram is not typed correctly.
            color: datasets[datasetIndex]?.lkHistogram.hexColor || 'black',
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

  const chartOptions = useMemo((): ChartOptions<'bar'> => {
    const font = {
      size: 11,
      family: fontFamily.mono?.join(', ') ?? 'sans-serif',
    } as const;
    const gridLineColor = colorForTheme('separator1', theme);

    const [startTs, endTs] = selectedTimeDomain;
    const timeAxisFormatOptions = getChartTimeAxisFormattingOptions(startTs, endTs);

    // Get bucket size from time series data, default to 1 hour if not specified
    const bucketSizeMs = props.timeSeries.bucketSizeSeconds
      ? durationInMs({ seconds: props.timeSeries.bucketSizeSeconds })
      : undefined;

    return {
      elements: {
        bar: {},
      },
      animation: false,
      layout: {
        autoPadding: false,
        padding: {
          right: 0,
          bottom: 2,
          left: 0,
          top: 0,
        },
      },
      interaction: {
        mode: 'x',
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
            onZoomComplete: ({ chart }) => {
              const bounds = chart.getZoomedScaleBounds();
              if (props.onTimeRangeChange && bounds.x !== undefined) {
                const { min, max } = bounds.x;
                props.onTimeRangeChange(
                  {
                    range: 'absolute',
                    start: Math.round(min),
                    end: Math.round(max),
                  },
                  true,
                );
              }
            },
          },
        },
      },
      scales: {
        // TIME AXIS
        x: {
          type: 'time',
          display: displayTicks,
          min: selectedTimeDomain[0],
          /**
           * Bar gap/offset problem: The combination of `offset: true` and `max` is not working as
           * expected and leaves a gap of one bar at the end of the chart.
           *
           * The solution is to use `offset: true` and subtract one bar width (`bucketSizeMs`) from
           * `max`.
           */
          max: selectedTimeDomain[1],
          // max:
          //   bucketSizeMs === undefined
          //     ? selectedTimeDomain[1]
          //     : selectedTimeDomain[1] - bucketSizeMs / 2,
          offset: false,
          ticks: {
            source: dataPoints.length > 5 ? 'data' : 'auto',
            align: 'center', // how the tick label is aligned to the tick stroke.
            includeBounds: false,
            // labelOffset: 0,
            callback: function (value) {
              return typeof value === 'number'
                ? readableTimestamp(value, { formatOptions: timeAxisFormatOptions })
                : '';
            },
            maxTicksLimit: Math.min(Math.round(props.width / 150), 5),
            maxRotation: 0,
            minRotation: 0,
            padding: 2,
            font: {
              ...font,
              family: fontFamily.sans?.join(', ') ?? 'sans-serif',
            },
          },
          stacked,
          grid: {
            drawOnChartArea: false,
            offset: false, // If true, grid lines will be shifted to be between labels.
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
          display: displayTicks,
          stacked,
          ...suggestedLimitsByUnit(unitType),
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
            font: font,
            padding: 6,
          },
          grid: {
            drawTicks: false,
            color: gridLineColor,
          },
          border: {
            display: false,
            color: gridLineColor,
          },
        },
      },
    };
  }, [
    theme,
    selectedTimeDomain,
    props,
    onLegendItems,
    externalTooltipHandler,
    unitType,
    displayTicks,
    dataPoints.length,
    stacked,
  ]);

  const plugins = useMemo(() => {
    const pluginList = [
      lkHistogramPlugin,
      htmlLegendPlugin,
      // debugChartPlugin,
    ];
    if (props.withZoom) {
      pluginList.push(zoomPlugin);
    }
    return pluginList;
  }, [props.withZoom]);

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
      {props.withLegend && <ChartLegend legendItems={legendItems} />}
      <div className="relative row-start-2 grow">
        <div className="relative h-full" style={{ width: props.width }}>
          <Bar
            data={{ datasets }}
            options={chartOptions}
            plugins={plugins}
            className="overflow-hidden"
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
