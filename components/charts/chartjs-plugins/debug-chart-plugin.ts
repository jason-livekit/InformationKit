import type { Chart, Plugin } from 'chart.js';

export const debugChartPlugin: Plugin<'bar'> = {
  id: 'debugChart',
  afterDraw(chart: Chart) {
    const {
      ctx,
      chartArea: { left, top, width, height },
    } = chart;
    if (!ctx) return;

    ctx.save();

    // Draw border around chart area (red dashed)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(left, top, width, height);

    // Draw border around full chart dimensions (blue dashed)
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    // Use chart dimensions instead of canvas dimensions
    ctx.strokeRect(0, 0, chart.width, chart.height);

    ctx.restore();
  },
};
