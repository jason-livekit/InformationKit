import type { Chart, ChartType, Plugin } from 'chart.js';

const PLUGIN_ID = 'leftGapFiller';

// TypeScript types for plugin options
export interface LeftGapFillerPluginOptions {
  enabled?: boolean;
}

// Extend Chart.js types to include our custom plugin
declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    [PLUGIN_ID]?: LeftGapFillerPluginOptions;
  }
}

// Custom left gap filler plugin
export const leftGapFillerPlugin: Plugin<'line', LeftGapFillerPluginOptions> = {
  id: PLUGIN_ID,
  afterDatasetsDraw: (chart: Chart<'line'>, args, options) => {
    if (!options?.enabled || !chart.scales.x || !chart.scales.y) {
      return;
    }

    const ctx = chart.ctx;
    if (!ctx) return;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const leftEdgeX = xScale.left;

    ctx.save();

    // Draw gap filler line for each dataset
    chart.data.datasets.forEach((dataset, index) => {
      const meta = chart.getDatasetMeta(index);
      if (!meta.visible) return;

      // Find the first data point with a valid value
      const firstValidPointIndex = dataset.data.findIndex(
        (point) =>
          typeof point === 'object' &&
          point !== null &&
          'y' in point &&
          point.y !== null &&
          point.y !== undefined,
      );
      if (firstValidPointIndex === -1) return;

      const firstPoint = dataset.data[firstValidPointIndex] as { x: number; y: number };
      const firstPointX = xScale.getPixelForValue(firstPoint.x);
      const firstPointY = yScale.getPixelForValue(firstPoint.y);

      if (firstPointX <= leftEdgeX) {
        return;
      }

      // Draw dashed line from left edge to first data point
      ctx.beginPath();
      ctx.moveTo(leftEdgeX, firstPointY);
      ctx.lineTo(firstPointX, firstPointY);
      ctx.strokeStyle = dataset.borderColor as string;
      ctx.lineWidth = dataset.borderWidth as number;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
    });

    ctx.restore();
  },
};
