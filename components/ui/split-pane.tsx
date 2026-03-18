import * as React from 'react';

import { DotGrid2X3SolidIcon } from '@/icons/react';
import { cn } from '@/lib/utils';
import { TextTooltip } from '@/components/ui/text-tooltip';

export interface SplitPaneProps {
  /** Enable overlay mode for before/after comparison (content doesn't resize with panes) */
  overlay?: boolean;
  /** Initial size of the first pane. Can be percent or pixels */
  initialSize?: string;
  /** Minimum size of the first pane (px). */
  minSize?: number;
  /** Minimum size of the second pane (px). */
  minSizeSecondary?: number;
  className?: string;
  children: [React.ReactNode, React.ReactNode];
  onChange?: (firstPaneSizePx: number, secondPaneSizePx: number) => void;
}

const DIVIDER_SIZE = 1;

export function SplitPane({
  initialSize = '50%',
  minSize = 80,
  minSizeSecondary = 80,
  className = '',
  overlay = false,
  children,
  onChange,
}: SplitPaneProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);
  const originRef = React.useRef(0);
  const startSizeRef = React.useRef(0);

  const [firstSizePx, setFirstSizePx] = React.useState<number | null>(null);
  const [containerSizePx, setContainerSizePx] = React.useState<number>(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const size = rect.width;
      setContainerSizePx(size);

      setFirstSizePx((prev) => {
        if (prev != null) return prev;
        if (initialSize.endsWith('%')) {
          const pct = parseFloat(initialSize) / 100;
          return Math.round(size * pct);
        }
        if (initialSize.endsWith('px')) {
          return Math.round(parseFloat(initialSize));
        }
        const n = Number(initialSize);
        if (!Number.isNaN(n)) return Math.round(size * (n > 1 ? n / 100 : n));
        return Math.round(size / 2);
      });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [initialSize]);

  const clamp = React.useCallback(
    (v: number) =>
      Math.max(minSize, Math.min(v, containerSizePx - minSizeSecondary - DIVIDER_SIZE)),
    [minSize, minSizeSecondary, containerSizePx],
  );

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const current = e.clientX;
      const delta = current - originRef.current;
      const newSize = clamp(startSizeRef.current + delta);
      setFirstSizePx(newSize);
      if (onChange) onChange(newSize, Math.round(containerSizePx - newSize - DIVIDER_SIZE));
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [clamp, onChange, containerSizePx]);

  const startDrag = (ev: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    (ev.target as Element).setPointerCapture(ev.pointerId);
    draggingRef.current = true;
    originRef.current = ev.clientX;
    startSizeRef.current = firstSizePx ?? el.clientWidth / 2;
  };

  const onDividerDoubleClick = () => {
    const size = containerSizePx;
    let newSize = Math.round(size / 2);
    if (initialSize.endsWith('%')) {
      const pct = parseFloat(initialSize) / 100;
      newSize = Math.round(size * pct);
    } else if (initialSize.endsWith('px')) {
      newSize = Math.round(parseFloat(initialSize));
    }
    newSize = clamp(newSize);
    setFirstSizePx(newSize);
    if (onChange) onChange(newSize, Math.round(containerSizePx - newSize - DIVIDER_SIZE));
  };

  const paneStyle: React.CSSProperties = firstSizePx != null ? { width: firstSizePx } : {};
  const clipRight = overlay && firstSizePx ? containerSizePx - firstSizePx - 5 : 0;
  const clipLeft = overlay && firstSizePx ? firstSizePx + 5 : containerSizePx;

  const firstPaneClipStyle: React.CSSProperties =
    overlay && firstSizePx != null ? { clipPath: `inset(0 ${clipRight}px 0 0)` } : {};

  const secondPaneClipStyle: React.CSSProperties =
    overlay && firstSizePx != null && containerSizePx > 0
      ? { clipPath: `inset(0 0 0 ${clipLeft}px)` }
      : {};

  const dividerLeft = firstSizePx ?? containerSizePx / 2;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className, { 'flex flex-row': !overlay })}
      style={{ userSelect: draggingRef.current ? 'none' : undefined }}
    >
      {overlay ? (
        <>
          <div className="absolute top-0 left-0 h-full w-full" style={firstPaneClipStyle}>
            <div className="h-full w-full overflow-auto">{children[0]}</div>
          </div>
          <div className="absolute top-0 left-0 h-full w-full" style={secondPaneClipStyle}>
            <div className="h-full w-full overflow-hidden">{children[1]}</div>
          </div>
        </>
      ) : (
        <>
          <div className="shrink-0" style={paneStyle}>
            <div className="h-full w-full overflow-auto">{children[0]}</div>
          </div>
          <TextTooltip side="right" align="center" text="Drag to resize, double-click to reset">
            <div
              role="separator"
              tabIndex={0}
              onPointerDown={startDrag}
              onDoubleClick={onDividerDoubleClick}
              className="relative z-10 -ms-[2px] -me-[2px] flex shrink-0 grow-0 basis-[5px] cursor-col-resize items-center justify-center ps-[2px] pe-[2px]"
            >
              <div className="bg-separator1 hover:bg-separator2 group h-full w-full">
                <div className="border-separator1 bg-bg3 hover:bg-separator2 group-hover:bg-separator2 absolute top-1/2 left-0 z-10 flex h-4 w-3 -translate-x-[3.5px] -translate-y-1/2 transform items-center justify-center rounded-sm border">
                  <DotGrid2X3SolidIcon className="text-fg1 size-3 shrink-0" />
                </div>
              </div>
            </div>
          </TextTooltip>
          <div className="relative z-0 min-h-0 min-w-0 flex-1">{children[1]}</div>
        </>
      )}
      {overlay && (
        <TextTooltip side="right" align="center" text="Drag to resize, double-click to reset">
          <div
            role="separator"
            tabIndex={0}
            onPointerDown={startDrag}
            onDoubleClick={onDividerDoubleClick}
            className="absolute z-10 flex h-full w-[5px] cursor-col-resize justify-center"
            style={{ left: dividerLeft + 2.5 }}
          >
            <div className="bg-separator1 hover:bg-separator2 group h-full w-px">
              <div className="border-separator1 bg-bg3 hover:bg-separator2 group-hover:bg-separator2 absolute top-1/2 left-1/2 z-10 flex h-4 w-3 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-sm border">
                <DotGrid2X3SolidIcon className="text-fg1 size-3 shrink-0" />
              </div>
            </div>
          </div>
        </TextTooltip>
      )}
    </div>
  );
}
