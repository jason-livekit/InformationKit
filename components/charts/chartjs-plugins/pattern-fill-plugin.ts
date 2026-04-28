import type { Chart, ChartType, Plugin } from 'chart.js';

const PLUGIN_ID = 'patternFill';

interface PatternFillPluginOptions {
  enabled?: boolean;
  /** Square dot size in pixels. Default: 2 */
  size?: number;
  /** Opacity of the dots. Default: 0.6 */
  opacity?: number;
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    [PLUGIN_ID]?: PatternFillPluginOptions;
  }
}

/**
 * Draws a square-dot pattern fill under line datasets with a vertical gradient fade (full opacity
 * at top, transparent at bottom).
 *
 * The pattern+gradient composite is pre-rendered on an offscreen canvas and cached. On each draw
 * frame only a clip-and-drawImage is needed, avoiding expensive `destination-out` compositing in
 * the hot path.
 */
export const patternFillPlugin: Plugin<'line', PatternFillPluginOptions> = {
  id: PLUGIN_ID,
  beforeDatasetDraw(chart: Chart<'line'>, args, options) {
    if (options?.enabled !== true) {
      return;
    }

    const { ctx } = chart;
    if (!ctx) return;
    const dataset = chart.data.datasets[args.index];
    const meta = chart.getDatasetMeta(args.index);
    if (
      dataset === undefined ||
      meta.visible !== true ||
      dataset.fill === undefined ||
      dataset.fill === false
    ) {
      return;
    }

    const size = options.size ?? 2;
    const opacity = options.opacity ?? 0.6;
    const color = String(dataset.borderColor);
    const chartArea = chart.chartArea;
    const yScale = chart.scales.y;
    if (yScale === undefined) {
      return;
    }

    const points = meta.data;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (firstPoint === undefined || lastPoint === undefined) {
      return;
    }

    const areaWidth = Math.ceil(chartArea.width);
    const areaHeight = Math.ceil(chartArea.height);
    if (areaWidth <= 0 || areaHeight <= 0) {
      return;
    }

    const composited = getCompositedFill(color, size, opacity, areaWidth, areaHeight);
    if (composited === null) {
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point !== undefined) {
        ctx.lineTo(point.x, point.y);
      }
    }
    const baseline = yScale.getPixelForValue(yScale.min);
    ctx.lineTo(lastPoint.x, baseline);
    ctx.lineTo(firstPoint.x, baseline);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(composited, chartArea.left, chartArea.top);

    ctx.restore();
  },
};

/**
 * Returns an offscreen canvas with the dot pattern already composited with a vertical gradient
 * fade. Cached by `color:size:opacity:width:height` so the expensive `destination-out` compositing
 * only runs when the chart area dimensions or color change.
 */
const compositedCache = new Map<string, HTMLCanvasElement>();

function getCompositedFill(
  color: string,
  size: number,
  opacity: number,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  const key = `${color}:${size}:${opacity}:${width}:${height}`;
  const cached = compositedCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = size * 2;
  patternCanvas.height = size * 2;
  const patternCtx = patternCanvas.getContext('2d');
  if (patternCtx === null) {
    return null;
  }
  patternCtx.fillStyle = color;
  patternCtx.fillRect(0, 0, size, size);

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d');
  if (offCtx === null) {
    return null;
  }

  const pattern = patternCtx.createPattern(patternCanvas, 'repeat');
  if (pattern === null) {
    return null;
  }

  offCtx.fillStyle = pattern;
  offCtx.globalAlpha = opacity;
  offCtx.fillRect(0, 0, width, height);

  offCtx.globalAlpha = 1;
  offCtx.globalCompositeOperation = 'destination-out';
  const gradient = offCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(1, 'rgba(255,255,255,1)');
  offCtx.fillStyle = gradient;
  offCtx.fillRect(0, 0, width, height);

  compositedCache.set(key, offscreen);
  return offscreen;
}
