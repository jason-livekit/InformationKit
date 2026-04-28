import type { Chart, ChartType, Plugin } from 'chart.js';

const PLUGIN_ID = 'crosshair';

// TypeScript types for plugin options
interface PluginOptions {
  enabled?: boolean;
  color: string;
  lineWidth: number;
  lineDash: number[];
}

// Extend Chart.js types to include our custom plugin
declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    [PLUGIN_ID]?: PluginOptions;
  }
}

// Custom crosshair plugin
export const crosshairPlugin: Plugin<'line', PluginOptions> = {
  id: PLUGIN_ID,
  defaults: {
    lineWidth: 1,
    lineDash: [2, 4],
    color: 'red',
  },
  afterDatasetsDraw: (chart: Chart<'line'>, args, options) => {
    if (options.enabled === false) {
      return;
    }
    if (chart.tooltip?.getActiveElements().length && chart.scales.y) {
      const ctx = chart.ctx;
      if (!ctx) return;
      const x = chart.tooltip.caretX;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      // Draw vertical line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = options.lineWidth;
      ctx.strokeStyle = options.color;
      ctx.setLineDash(options.lineDash);
      ctx.stroke();
      ctx.restore();
    }
  },
};
