'use client';

import { useMemo, useState } from 'react';
import type { Chart, Plugin } from 'chart.js';

export interface PulsingMarker {
  x: number;
  y: number;
  color: string;
}

/**
 * Creates a Chart.js plugin that extracts the pixel position and color of each dataset's last
 * data point after every draw and pushes them to the provided callback.
 *
 * Positions are read synchronously inside Chart.js's `afterDraw` hook, so they're always in sync
 * with the rendered chart -- no requestAnimationFrame delay.
 */
export function createLastPointPlugin(onMarkers: (markers: PulsingMarker[]) => void): Plugin {
  return {
    id: 'lastPointPositions',
    afterDraw: (chart: Chart) => {
      if (!chart.scales?.x || !chart.scales?.y) {
        onMarkers([]);
        return;
      }

      const result: PulsingMarker[] = [];
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.visible || !dataset.data.length) {
          return;
        }

        const lastPoint = dataset.data[dataset.data.length - 1];
        if (
          !lastPoint ||
          typeof lastPoint !== 'object' ||
          !('x' in lastPoint) ||
          !('y' in lastPoint) ||
          lastPoint.x === null ||
          lastPoint.y === null
        ) {
          return;
        }

        const x = chart.scales.x?.getPixelForValue(lastPoint.x);
        const y = chart.scales.y?.getPixelForValue(lastPoint.y);
        if (x === undefined || y === undefined) {
          return;
        }

        result.push({
          x,
          y,
          color: typeof dataset.borderColor === 'string' ? dataset.borderColor : '#000',
        });
      });

      onMarkers(result);
    },
  };
}

/** Hook that wires up the last-point plugin and returns the markers + plugin to pass to Chart.js. */
export function useLastPointMarkers(): { markers: PulsingMarker[]; plugin: Plugin } {
  const [markers, setMarkers] = useState<PulsingMarker[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plugin = useMemo(() => createLastPointPlugin(setMarkers), []);
  return { markers, plugin };
}

/**
 * Pulsing markers positioned over a Chart.js canvas at each dataset's last data point to signal
 * that more data is expected.
 *
 * The animation uses CSS (`animate-ping`) so the browser compositor handles it on the GPU with zero
 * JavaScript per frame. Marker positions come from `useLastPointMarkers`, which reads them
 * synchronously in Chart.js's `afterDraw` hook -- no frame delay between chart draw and overlay.
 */
export function PulsingOverlay(props: {
  markers: PulsingMarker[];
  enabled: boolean;
  /** Marker size in pixels. Default: 7 */
  size?: number;
}) {
  const size = props.size ?? 7;

  if (!props.enabled || props.markers.length === 0) {
    return null;
  }

  return (
    <>
      {props.markers.map((marker, index) => (
        <div
          key={index}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${marker.x}px`,
            top: `${marker.y}px`,
          }}
        >
          <div
            className="rounded-px absolute inset-0 animate-ping"
            style={{ width: size, height: size, backgroundColor: marker.color }}
          />
          <div
            className="rounded-px"
            style={{ width: size, height: size, backgroundColor: marker.color }}
          />
        </div>
      ))}
    </>
  );
}
