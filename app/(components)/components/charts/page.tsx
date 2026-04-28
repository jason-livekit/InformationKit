"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { AnalyticsUnit_Type } from "@/components/charts/types";
import { genMockTimeSeries } from "@/components/charts/time-series-data/mock-data";
import { durationInMs } from "@/lib/charts/time-utils";
import { ExampleCard } from "../_shared/example-card";

// Chart.js evaluates side-effects (Chart.register, plugin registration, dayjs adapter) at module
// load. Those reference `window`, which breaks SSR. Dynamic-import with ssr disabled.
const LineChart = dynamic(
  () => import("@/components/charts/LineChart").then((m) => m.LineChart),
  { ssr: false },
);
const Histogram = dynamic(
  () => import("@/components/charts/Histogram").then((m) => m.Histogram),
  { ssr: false },
);
const LineChartTrendGraph = dynamic(
  () => import("@/components/charts/LineChartTrendGraph").then((m) => m.LineChartTrendGraph),
  { ssr: false },
);
const HistogramTrendGraph = dynamic(
  () => import("@/components/charts/HistogramTrendGraph").then((m) => m.HistogramTrendGraph),
  { ssr: false },
);

const NOW = Date.now();
const DAY_AGO = NOW - durationInMs({ days: 1 });

const lineSeries = genMockTimeSeries({
  dataLineNames: ["Egress", "Ingress", "Recordings", "Streaming"],
  numDataPoints: 96,
  startTimestamp: DAY_AGO,
  dataPointSpacing: durationInMs({ minutes: 15 }),
  range: { min: 0, max: 1_000 },
  unit: AnalyticsUnit_Type.Quantity,
  seed: 42,
});

const histogramSeries = genMockTimeSeries({
  dataLineNames: ["Successful sessions", "Failed sessions"],
  numDataPoints: 24,
  startTimestamp: DAY_AGO,
  dataPointSpacing: durationInMs({ hours: 1 }),
  range: { min: 0, max: 200 },
  unit: AnalyticsUnit_Type.Quantity,
  seed: 7,
});

const seriesWithGap = genMockTimeSeries({
  dataLineNames: ["Bandwidth"],
  numDataPoints: 96,
  startTimestamp: DAY_AGO,
  dataPointSpacing: durationInMs({ minutes: 15 }),
  range: { min: 1e6, max: 1e9 },
  unit: AnalyticsUnit_Type.BitsPerSecond,
  gaps: [{ start: 30, end: 50 }],
  seed: 99,
});

function ChartFrame({
  height,
  children,
}: {
  height: number;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}

export default function ChartsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Charts</h2>
        <p className="text-sm text-fg3 mt-1">
          Time series charts and data visualizations from the LiveKit cloud app. Chart colors react
          to <code className="text-fg1 bg-bg2 rounded px-1.5 py-0.5 text-xs">data-lk-theme</code>{" "}
          changes.
        </p>
      </div>

      <ExampleCard
        id="line-chart"
        title="LineChart"
        description="Multi-series time series chart with formatted axes, hover crosshair, and legend."
        importPath="@/components/charts/LineChart"
      >
        <ExampleCard.Group label="Multi-series with crosshair and legend">
          <ChartFrame height={288}>
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                timeSeries={lineSeries}
                timeDomain={undefined}
                withScales
                withCrosshair
                withLegend
              />
            )}
          </ChartFrame>
        </ExampleCard.Group>
        <ExampleCard.Group label="Bandwidth unit with data gap (left-gap-filler plugin)">
          <ChartFrame height={288}>
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                timeSeries={seriesWithGap}
                timeDomain={undefined}
                withScales
                withCrosshair
                withLegend
                withLeftGapFiller
              />
            )}
          </ChartFrame>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="line-chart-trend"
        title="LineChartTrendGraph"
        description="Compact LineChart variant pairing a summary scalar with a sparkline."
        importPath="@/components/charts/LineChartTrendGraph"
      >
        <ChartFrame height={160}>
          {({ width, height }) => (
            <LineChartTrendGraph
              width={width}
              height={height}
              timeSeries={lineSeries}
              timeDomain={undefined}
            />
          )}
        </ChartFrame>
      </ExampleCard>

      <ExampleCard
        id="histogram"
        title="Histogram"
        description="Stacked bar chart for distributions and bucketed time series."
        importPath="@/components/charts/Histogram"
      >
        <ChartFrame height={288}>
          {({ width, height }) => (
            <Histogram
              width={width}
              height={height}
              timeSeries={histogramSeries}
              timeDomain={undefined}
              withScales
              withLegend
            />
          )}
        </ChartFrame>
      </ExampleCard>

      <ExampleCard
        id="histogram-trend"
        title="HistogramTrendGraph"
        description="Compact Histogram variant for inline trend display."
        importPath="@/components/charts/HistogramTrendGraph"
      >
        <ChartFrame height={160}>
          {({ width, height }) => (
            <HistogramTrendGraph
              width={width}
              height={height}
              timeSeries={histogramSeries}
              timeDomain={undefined}
            />
          )}
        </ChartFrame>
      </ExampleCard>
    </div>
  );
}
