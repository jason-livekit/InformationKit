import type { ChartType, Color, Plugin } from 'chart.js';

export const PLUGIN_ID = 'lkHistogram';

interface PluginOptions {
  enabled: boolean;
  /** The thickness of the line at the top of the bar. */
  lineWidth: number;
  backgroundColor: string;
  hexColor: string;
  /** As hex color */
  hoverBarBackgroundColor: string;
}

// Extend Chart.js types to include our custom plugin
declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    [PLUGIN_ID]?: PluginOptions;
    data: {
      datasets: {
        [PLUGIN_ID]?: PluginOptions;
      }[];
    };
  }
}

export const lkHistogramPlugin: Plugin<'bar', PluginOptions> = {
  id: PLUGIN_ID,

  defaults: {
    enabled: true,
    lineWidth: 1.5,
    hexColor: '#ff0000',
    hoverBarBackgroundColor: '#323232',
  },

  afterDatasetsUpdate(chart, args, options) {
    /**
     * Shift the bar half a bar to the right so the bar aligns with the time axis. Impl. source:
     * https://github.com/chartjs/Chart.js/discussions/10433
     */
    for (let i = 0; i < chart.data.datasets.length; i++) {
      const m = chart.getDatasetMeta(i);
      m.data.forEach((d) => {
        const { x, width } = d.getProps(['x', 'width']);
        d.x = x + width / 2;
      });
    }
  },

  /** Draw a full-height, bar-width hover column behind the bars to highlight the hovered index. */
  beforeDatasetsDraw(chart, _args, options) {
    if (!options.enabled) return;

    const active = chart.getActiveElements();
    if (!active || active.length === 0) return;

    const firstActive = active[0];
    const datasetIndex = firstActive?.datasetIndex;
    const elementIndex = firstActive?.index;
    if (datasetIndex == null || elementIndex == null) return;
    const activeMeta = chart.getDatasetMeta(datasetIndex);
    const activeElement = activeMeta?.data?.[elementIndex];
    if (!activeElement) return;

    const { ctx, chartArea } = chart;
    if (!ctx) return;
    const { x, width } = activeElement.getProps(['x', 'width']);

    // Guard against invalid sizes
    if (!isFinite(x) || !isFinite(width) || width <= 0) return;

    ctx.save();
    // Clip to chart area so the highlight does not bleed into axes/padding
    ctx.beginPath();
    ctx.rect(
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top,
    );
    ctx.clip();

    const startX = x - width / 2;
    const overlayHeight = chartArea.bottom - chartArea.top;
    ctx.fillStyle = `rgb(from ${options.hoverBarBackgroundColor} r g b / 0.3)`;
    ctx.fillRect(startX, chartArea.top, width, overlayHeight);

    ctx.restore();
  },

  beforeUpdate(chart, args, options) {
    if (options?.enabled === false) {
      return;
    }

    // Set minBarLength on each dataset if not already set. Chart.js recommends mutating
    // config in place so other options are preserved and update loops are avoided.
    // @see https://www.chartjs.org/docs/latest/developers/updates.html#updating-options
    chart.config.data.datasets.forEach((dataset) => {
      if (dataset.minBarLength === undefined) {
        (dataset as { minBarLength?: number }).minBarLength = options.lineWidth;
      }
    });
  },

  afterDatasetsDraw(chart, args, options) {
    if (!options.enabled) return;

    const { ctx } = chart;
    if (!ctx) return;
    const { datasets } = chart.data;

    ctx.save();
    // Set up clipping to respect chart area boundaries
    const { left, right, top, bottom } = chart.chartArea;
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();

    // Iterate through each dataset
    datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      //@ts-expect-error lkHistogram is not typed correctly.
      const hexColor = dataset.lkHistogram?.hexColor;

      if (meta.type !== 'bar' || !meta.visible) return;

      // Iterate through each bar in the dataset
      meta.data.forEach((bar) => {
        // @ts-expect-error skip seems to be a property of the element.
        if (!bar.active && bar.skip) return;

        const { x, y, width, height } = bar.getProps(['x', 'y', 'width', 'height']);

        if (height === 0) return;

        // Draw the bar background with pattern
        const isHovered = bar.active;
        const patternKey = isHovered ? `hover:${hexColor}` : `normal:${hexColor}`;
        const pattern = getCachedPattern(
          patternKey,
          isHovered ? `rgb(from ${hexColor} r g b / 0.6)` : `rgb(from ${hexColor} r g b / 0.30)`,
        );

        ctx.fillStyle = pattern;

        const startX = x - width / 2;
        const barTop = y;

        // Draw the full bar background with pattern
        ctx.fillRect(startX, barTop, width, height);

        // Use the bar's border color for top border
        ctx.fillStyle = hexColor;

        // Calculate top border dimensions
        const lineWidthClipped = Math.min(options.lineWidth, height);

        // Draw the top border as a simple rectangle
        ctx.fillRect(startX, y, width, lineWidthClipped);
      });
    });

    // Restore the canvas state
    ctx.restore();
  },
};

const patternCache = new Map<string, CanvasPattern | string>();

function getCachedPattern(key: string, color: Color): CanvasPattern | string {
  const cached = patternCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const pattern = squarePattern(color);
  patternCache.set(key, pattern);
  return pattern;
}

function squarePattern(color: Color): CanvasPattern | string {
  const patternCanvas = document.createElement('canvas');
  const patternContext = patternCanvas.getContext('2d');

  const size = 1;
  const gap = 1.5;
  patternCanvas.width = size * 2 + gap;
  patternCanvas.height = size * 2 + gap;

  if (patternContext !== null) {
    patternContext.fillStyle = color;
    patternContext.fillRect(0, 0, size, size);
    patternContext.fillRect(0, 0, size, size);
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    const pattern = context.createPattern(patternCanvas, 'repeat');
    if (pattern) {
      return pattern;
    }
  }
  console.warn('Failed to create canvas pattern.');
  return 'transparent';
}
