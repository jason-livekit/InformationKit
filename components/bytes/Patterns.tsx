import { Pattern, PatternLines } from '@visx/pattern';

export const HatchPattern = () => (
  <PatternLines
    id="hatch"
    height={10}
    width={10}
    stroke="#999"
    strokeWidth={3.5}
    orientation={['diagonal']}
  />
);

type SquareDotsPatternProps = {
  id: string;
  fill: string;
  size: number;
  opacity?: number;
};

// To use SquareDotsPattern and GradientMask together in, say, a polygon, do something like:
// <svg>
//   <SquareDotsPattern id="squaredots" size=2.5" />
//   <GradientMask id="gradientmask" />
//   <polygon points={...} fill="url(#squaredots)" mask="url(#gradientmask)" />
//  </svg>

export const SquareDotsPattern = ({ id, fill, size, opacity }: SquareDotsPatternProps) => (
  <Pattern id={id} width={size * 2} height={size * 2}>
    <rect width={size} height={size} x={0} y={0} style={{ fill }} opacity={opacity} />
  </Pattern>
);

type GradientMaskProps = { id: string; width: number; height: number };

export const GradientMask = ({ id, width, height }: GradientMaskProps) => {
  const linearGradientId = 'gradient-for-' + id;
  return (
    <defs>
      <linearGradient id={linearGradientId} gradientTransform="rotate(90)">
        <stop offset="0" stopColor="white" stopOpacity="1" />
        <stop offset="1" stopColor="white" stopOpacity="0.05" />
      </linearGradient>
      <mask id={id}>
        <rect x="0" y="0" width={width} height={height} fill={`url(#${linearGradientId})`} />
      </mask>
    </defs>
  );
};
