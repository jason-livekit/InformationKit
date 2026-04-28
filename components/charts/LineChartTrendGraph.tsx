import { Scalar } from './Scalar';
import { LineChart } from './LineChart';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LineChartTrendGraphProps extends React.ComponentProps<typeof LineChart> {}
export function LineChartTrendGraph(props: LineChartTrendGraphProps) {
  const { timeSeries, height, ...passthroughProps } = props;

  return (
    <div
      className="grid h-full max-h-full grid-rows-[minmax(0px,2fr)_minmax(0px,1fr)]"
      style={{ height }}
    >
      <div className="grid place-items-center">
        {timeSeries.summary && <Scalar data={timeSeries.summary} />}
      </div>

      <LineChart
        {...passthroughProps}
        height={undefined}
        timeSeries={timeSeries}
        withScales={false}
        withCrosshair={false}
      />
    </div>
  );
}
