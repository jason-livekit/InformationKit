import { Scalar } from './Scalar';
import { Histogram } from './Histogram';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface HistogramTrendGraphProps extends React.ComponentProps<typeof Histogram> {}

export function HistogramTrendGraph(props: HistogramTrendGraphProps): React.JSX.Element {
  const { timeSeries, height, ...passthroughProps } = props;

  return (
    <div className="grid max-h-full grid-rows-[minmax(0px,1fr)_minmax(0px,1fr)]" style={{ height }}>
      <div className="grid place-items-center">
        {timeSeries.summary && <Scalar data={timeSeries.summary} />}
      </div>

      <Histogram
        timeSeries={timeSeries}
        withScales={false}
        {...passthroughProps}
        height={undefined}
      />
    </div>
  );
}
