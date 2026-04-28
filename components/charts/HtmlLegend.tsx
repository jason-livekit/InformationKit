'use client';

import { useCallback, useState } from 'react';
import type { ChartType, LegendItem, Plugin } from 'chart.js';

import { PLUGIN_ID as LK_HISTOGRAM_PLUGIN_ID } from './chartjs-plugins/histogram-plugin';

export function ChartLegend(props: { legendItems: ReturnType<typeof useLegend>['legendItems'] }) {
  if (props.legendItems.length < 1) {
    return null;
  }
  return (
    <ul className="text-fg3 mb-3 flex gap-4 text-xs select-none">
      {props.legendItems.map((item) => (
        <li
          key={item.text}
          className="group flex cursor-pointer items-center gap-1.5"
          onClick={(e) => item.onClick?.(e.metaKey || e.ctrlKey)}
        >
          <span
            className="rounded-px inline-block size-1.5"
            style={{
              backgroundColor: item.color,
              opacity: item.visible ? 1 : 0.35,
            }}
          />
          <span
            className={
              item.visible
                ? 'text-fg3 group-hover:text-fg2 text-xs transition-colors'
                : 'text-fg4 text-xs line-through'
            }
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

const PLUGIN_ID = 'htmlLegend';

interface PluginOptions {
  display: boolean;
  onLegendItems: (items: LegendItemExtended[]) => void;
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    [PLUGIN_ID]?: PluginOptions;
  }
}

interface LegendItemExtended extends LegendItem {
  color: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: (isolate: boolean) => void;
  visible: boolean;
}

export const htmlLegendPlugin: Plugin<ChartType, PluginOptions> = {
  id: PLUGIN_ID,
  afterUpdate(chart, args, options) {
    if (options.display === false) {
      return;
    }
    // @ts-expect-error Fix this
    const items = chart.options.plugins.legend.labels.generateLabels(chart).map((item) => {
      const datasetIndex = item.datasetIndex ?? -1;

      const color = chart.isPluginEnabled(LK_HISTOGRAM_PLUGIN_ID)
        ? // @ts-expect-error Fix this
          (chart.data.datasets[datasetIndex]?.lkHistogram?.hexColor ?? 'red')
        : item.fillStyle?.toString();

      return {
        ...item,
        color: color,
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        onClick: (isolate: boolean) => {
          const total = chart.data.datasets.length;
          const clickedVisible = chart.isDatasetVisible(datasetIndex);
          if (isolate) {
            let visibleCount = 0;
            for (let i = 0; i < total; i++) {
              if (chart.isDatasetVisible(i)) visibleCount += 1;
            }
            const isolate = !(visibleCount === 1 && clickedVisible);
            for (let i = 0; i < total; i++) {
              const shouldShow = isolate ? i === datasetIndex : true;
              chart.setDatasetVisibility(i, shouldShow);
            }
          } else {
            chart.setDatasetVisibility(datasetIndex, !clickedVisible);
          }
          chart.update('none');
        },
        visible: chart.isDatasetVisible(datasetIndex),
      } satisfies LegendItemExtended;
    });

    options.onLegendItems?.(items);
  },
};

export function useLegend() {
  const [legendItems, setLegendItem] = useState<LegendItemExtended[]>([]);
  const onLegendItems: PluginOptions['onLegendItems'] = useCallback(
    (items: LegendItemExtended[]) => {
      setLegendItem(items);
    },
    [setLegendItem],
  );
  return {
    legendItems,
    onLegendItems,
  };
}
