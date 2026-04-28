import { useEffect, useRef, useState, type Ref } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import type { Color } from 'chart.js';

export interface TooltipData {
  title: string[];
  body: { lines: string[]; color: Color }[];
  opacity: number;
}

export function ChartTooltip(props: {
  data: TooltipData | undefined;
  ref: Ref<HTMLDivElement>;
  style?: React.CSSProperties;
}) {
  /**
   * Only enable transform transitions after the first frame so that Floating UI can position the
   * tooltip without animation. This prevents the tooltip from visibly sliding in from a stale
   * position when moving between charts.
   */
  const isVisible = props.data !== undefined;
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current) {
      prevVisibleRef.current = true;
      const frame = requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }
    if (!isVisible && prevVisibleRef.current) {
      prevVisibleRef.current = false;
      setShouldAnimate(false);
    }
  }, [isVisible]);

  if (props.data === undefined) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={props.ref}
        className={`border-separator1 bg-bg2 text-fg2 dark:border-separator2 dark:bg-bg3 pointer-events-none absolute z-50 flex w-fit min-w-60 flex-col gap-1 rounded border px-4 py-3 drop-shadow-md ${shouldAnimate ? 'transition-[transform] duration-200 ease-out' : ''}`}
        style={props.style}
      >
        {props.data.title.map((title, index) => (
          <div key={index} className="font-mono text-xs font-bold whitespace-nowrap">
            {title ? title : '—'}
          </div>
        ))}
        <ul className="m-0 w-full p-0">
          {props.data.body.map((item, index) => {
            const [name, value] = item.lines;
            return (
              <li
                key={index}
                className="grid grid-cols-[minmax(0px,1fr)_minmax(0px,auto)] items-center justify-between gap-3 whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span
                    className="rounded-px inline-block size-1.5 shrink-0"
                    style={{ backgroundColor: item.color.toString() }}
                  />
                  {name}
                </span>
                <span className="text-xs">{value}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </FloatingPortal>
  );
}
