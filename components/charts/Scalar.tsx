import * as React from 'react';

import {
  AnalyticsUnit_Type,
  type AnalyticsScalarData,
} from '@/components/charts/types';
import { readableNumberAsParts } from '@/lib/charts/readable-numbers';

/**
 * Renders a summary value next to a chart (used by `LineChartTrendGraph` and
 * `HistogramTrendGraph`). Mirrors the cloud app's Scalar component but with a simpler scalar shape
 * (no fraction/custom variants).
 */
export function Scalar(props: { data: AnalyticsScalarData }) {
  const accentClass = 'text-3xl text-fgAccent1';
  const notSoAccentClass = 'text-xl text-fgAccent2';

  const scalar = props.data.scalar;
  const numericValue = ((): number | null => {
    switch (scalar.case) {
      case 'uint64Value':
      case 'floatValue':
      case 'timeStamp':
        return scalar.value;
      case 'boolValue':
        return scalar.value ? 1 : 0;
      case 'stringValue':
      default:
        return null;
    }
  })();

  if (numericValue === null) {
    return (
      <div className="m-2 w-fit max-w-full overflow-hidden lg:m-4">
        <span className={accentClass}>{scalar.case === 'stringValue' ? scalar.value : '-'}</span>
      </div>
    );
  }

  const parts = readableNumberAsParts(numericValue, {
    unit: props.data.unit?.type ?? AnalyticsUnit_Type.Quantity,
    formatOptions: { notation: 'compact' },
  });

  return (
    <div className="m-2 w-fit max-w-full overflow-hidden lg:m-4">
      <span className={accentClass}>
        {parts.map((p, index) =>
          ['unit', 'compact'].includes(p.type) ? (
            <span key={`${index}${p.value}`} className={notSoAccentClass}>
              {p.value}
            </span>
          ) : (
            p.value
          ),
        )}
      </span>
    </div>
  );
}
