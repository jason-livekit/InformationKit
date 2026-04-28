import * as React from 'react';

import { DotGrid2X3SolidIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { TextTooltip } from './TextTooltip';

export interface SplitPaneContextValue {
  /** Current size of this pane in pixels. */
  size: number;
  /** Minimum allowed size of this pane in pixels. */
  minSize: number;
  /** Maximum allowed size of this pane in pixels. */
  maxSize: number;
  /** Whether this is the first (0) or second (1) pane. */
  paneIndex: 0 | 1;
  /** Set this pane to its minimum size. */
  minimize: () => void;
  /** Set this pane to its maximum size. */
  maximize: () => void;
  /** Reset both panes to the initial/default split. */
  resetSize: () => void;
  /** Set this pane to an exact pixel size (clamped to min/max). */
  setSize: (px: number) => void;
}

const SplitPaneContext = React.createContext<SplitPaneContextValue | null>(null);

/** Access the split pane context from within a pane's children. */
export function useSplitPane(): SplitPaneContextValue {
  const ctx = React.useContext(SplitPaneContext);
  if (!ctx) {
    throw new Error('useSplitPaneContext must be used within a SplitPane child');
  }
  return ctx;
}

export interface SplitPaneProps {
  /** Split direction. 'horizontal' splits left/right, 'vertical' splits top/bottom. */
  orientation?: 'horizontal' | 'vertical';
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
  orientation = 'horizontal',
  initialSize = '50%',
  minSize = 80,
  minSizeSecondary = 80,
  className = '',
  overlay = false,
  children,
  onChange,
}: SplitPaneProps) {
  const isVertical = orientation === 'vertical';
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);
  const originRef = React.useRef(0);
  const startSizeRef = React.useRef(0); // starting size of first pane in px

  const [firstSizePx, setFirstSizePx] = React.useState<number | null>(null);
  const [containerSizePx, setContainerSizePx] = React.useState<number>(0);

  const resolveInitialSize = React.useCallback(
    (containerSize: number): number => {
      if (initialSize.endsWith('%')) {
        return Math.round(containerSize * (parseFloat(initialSize) / 100));
      }
      if (initialSize.endsWith('px')) {
        return Math.round(parseFloat(initialSize));
      }
      const n = Number(initialSize);
      if (!Number.isNaN(n)) return Math.round(containerSize * (n > 1 ? n / 100 : n));
      return Math.round(containerSize / 2);
    },
    [initialSize],
  );

  // Compute container size when mounted or on resize
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const size = isVertical ? rect.height : rect.width;
      setContainerSizePx(size);

      // Initialize firstSizePx from initialSize when not set
      setFirstSizePx((prev) => {
        if (prev != null) return prev;
        return resolveInitialSize(size);
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
  }, [resolveInitialSize, isVertical]);

  const clamp = React.useCallback(
    (v: number) =>
      Math.max(minSize, Math.min(v, containerSizePx - minSizeSecondary - DIVIDER_SIZE)),
    [minSize, minSizeSecondary, containerSizePx],
  );

  const applyFirstSize = React.useCallback(
    (newSize: number) => {
      const clamped = clamp(newSize);
      setFirstSizePx(clamped);
      if (onChange) onChange(clamped, Math.round(containerSizePx - clamped - DIVIDER_SIZE));
    },
    [clamp, onChange, containerSizePx],
  );

  // Pointer / touch handlers
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const current = isVertical ? e.clientY : e.clientX;
      const delta = current - originRef.current;
      const newSize = clamp(startSizeRef.current + delta);
      setFirstSizePx(newSize);
      if (onChange) onChange(newSize, Math.round(containerSizePx - newSize - DIVIDER_SIZE));
    };

    const onUp = () => {
      draggingRef.current = false;
      (document as any).releasePointerCapture?.(0);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [clamp, onChange, containerSizePx, isVertical]);

  const startDrag = (ev: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    (ev.target as Element).setPointerCapture(ev.pointerId);
    draggingRef.current = true;
    originRef.current = isVertical ? ev.clientY : ev.clientX;
    startSizeRef.current = firstSizePx ?? (isVertical ? el.clientHeight : el.clientWidth) / 2;
  };

  const onDividerDoubleClick = () => {
    applyFirstSize(resolveInitialSize(containerSizePx));
  };

  // --- Pane context values ---

  const firstMax = containerSizePx - minSizeSecondary - DIVIDER_SIZE;
  const secondMax = containerSizePx - minSize - DIVIDER_SIZE;
  const currentFirst = firstSizePx ?? resolveInitialSize(containerSizePx);
  const currentSecond = containerSizePx - currentFirst - DIVIDER_SIZE;

  const firstPaneCtx = React.useMemo<SplitPaneContextValue>(
    () => ({
      size: currentFirst,
      minSize,
      maxSize: firstMax,
      paneIndex: 0,
      minimize: () => applyFirstSize(minSize),
      maximize: () => applyFirstSize(firstMax),
      resetSize: () => applyFirstSize(resolveInitialSize(containerSizePx)),
      setSize: (px: number) => applyFirstSize(px),
    }),
    [currentFirst, minSize, firstMax, applyFirstSize, resolveInitialSize, containerSizePx],
  );

  const secondPaneCtx = React.useMemo<SplitPaneContextValue>(
    () => ({
      size: currentSecond,
      minSize: minSizeSecondary,
      maxSize: secondMax,
      paneIndex: 1,
      minimize: () => applyFirstSize(firstMax),
      maximize: () => applyFirstSize(minSize),
      resetSize: () => applyFirstSize(resolveInitialSize(containerSizePx)),
      setSize: (px: number) => applyFirstSize(containerSizePx - px - DIVIDER_SIZE),
    }),
    [
      currentSecond,
      minSizeSecondary,
      secondMax,
      firstMax,
      minSize,
      applyFirstSize,
      resolveInitialSize,
      containerSizePx,
    ],
  );

  // --- Render ---

  const paneStyle: React.CSSProperties =
    firstSizePx != null ? (isVertical ? { height: firstSizePx } : { width: firstSizePx }) : {};

  // In overlay mode both panes are full size, clipped to show only appropriate portions
  const clipAfter = overlay && firstSizePx ? containerSizePx - firstSizePx - 5 : 0;
  const clipBefore = overlay && firstSizePx ? firstSizePx + 5 : containerSizePx;

  const firstPaneClipStyle: React.CSSProperties =
    overlay && firstSizePx != null
      ? {
          clipPath: isVertical ? `inset(0 0 ${clipAfter}px 0)` : `inset(0 ${clipAfter}px 0 0)`,
        }
      : {};

  const secondPaneClipStyle: React.CSSProperties =
    overlay && firstSizePx != null && containerSizePx > 0
      ? {
          clipPath: isVertical ? `inset(${clipBefore}px 0 0 0)` : `inset(0 0 0 ${clipBefore}px)`,
        }
      : {};

  // Divider position
  const dividerOffset = firstSizePx ?? containerSizePx / 2;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className, {
        'flex flex-row': !overlay && !isVertical,
        'flex flex-col': !overlay && isVertical,
      })}
      style={{ userSelect: draggingRef.current ? 'none' : undefined }}
    >
      {overlay ? (
        <>
          {/* Overlay mode: Absolutely positioned, full width, clipped */}
          <div className="absolute top-0 left-0 h-full w-full" style={firstPaneClipStyle}>
            <div className="h-full w-full overflow-auto">
              <SplitPaneContext.Provider value={firstPaneCtx}>
                {children[0]}
              </SplitPaneContext.Provider>
            </div>
          </div>

          <div className="absolute top-0 left-0 h-full w-full" style={secondPaneClipStyle}>
            <div className="h-full w-full overflow-hidden">
              <SplitPaneContext.Provider value={secondPaneCtx}>
                {children[1]}
              </SplitPaneContext.Provider>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Flexible mode: Normal flexbox layout */}
          <div className="shrink-0 overflow-hidden" style={paneStyle}>
            <div className="h-full w-full overflow-auto">
              <SplitPaneContext.Provider value={firstPaneCtx}>
                {children[0]}
              </SplitPaneContext.Provider>
            </div>
          </div>

          <TextTooltip
            side={isVertical ? 'bottom' : 'right'}
            align="center"
            text="Drag to resize, double-click to reset"
          >
            <div
              role="separator"
              tabIndex={0}
              onPointerDown={startDrag}
              onDoubleClick={onDividerDoubleClick}
              className={cn(
                'relative z-10 flex shrink-0 grow-0 items-center justify-center',
                isVertical
                  ? '-mt-[2px] -mb-[2px] basis-[5px] cursor-row-resize pt-[2px] pb-[2px]'
                  : '-ms-[2px] -me-[2px] basis-[5px] cursor-col-resize ps-[2px] pe-[2px]',
              )}
            >
              <div className="bg-separator1 hover:bg-separator2 group h-full w-full">
                <div
                  className={cn(
                    'border-separator1 bg-bg3 hover:bg-separator2 group-hover:bg-separator2 absolute z-10 flex transform items-center justify-center rounded-sm border',
                    isVertical
                      ? 'top-0 left-1/2 h-3 w-4 -translate-x-1/2 -translate-y-[3.5px] rotate-90'
                      : 'top-1/2 left-0 h-4 w-3 -translate-x-[3.5px] -translate-y-1/2',
                  )}
                >
                  <DotGrid2X3SolidIcon className="text-fg1 size-3 shrink-0" />
                </div>
              </div>
            </div>
          </TextTooltip>

          <div className="relative z-0 min-h-0 min-w-0 flex-1">
            <SplitPaneContext.Provider value={secondPaneCtx}>
              {children[1]}
            </SplitPaneContext.Provider>
          </div>
        </>
      )}

      {/* Divider for overlay mode */}
      {overlay && (
        <TextTooltip
          side={isVertical ? 'bottom' : 'right'}
          align="center"
          text="Drag to resize, double-click to reset"
        >
          <div
            role="separator"
            tabIndex={0}
            onPointerDown={startDrag}
            onDoubleClick={onDividerDoubleClick}
            className={cn(
              'absolute z-10 flex justify-center',
              isVertical ? 'h-[5px] w-full cursor-row-resize' : 'h-full w-[5px] cursor-col-resize',
            )}
            style={isVertical ? { top: dividerOffset + 2.5 } : { left: dividerOffset + 2.5 }}
          >
            <div
              className={cn(
                'bg-separator1 hover:bg-separator2 group',
                isVertical ? 'h-px w-full' : 'h-full w-px',
              )}
            >
              <div
                className={cn(
                  'border-separator1 bg-bg3 hover:bg-separator2 group-hover:bg-separator2 absolute top-1/2 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-sm border',
                  isVertical ? 'h-3 w-4 rotate-90' : 'h-4 w-3',
                )}
              >
                <DotGrid2X3SolidIcon className="text-fg1 size-3 shrink-0" />
              </div>
            </div>
          </div>
        </TextTooltip>
      )}
    </div>
  );
}
