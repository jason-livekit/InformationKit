'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { ViewportBounds } from './MapCanvas';

interface ToolbarShellProps {
  /** Horizontal center the toolbar wants to sit above. */
  anchorX: number;
  /** Top / bottom edge (screen y) of the thing being annotated. */
  anchorTop: number;
  anchorBottom: number;
  /** Map area in screen coords; the toolbar is clamped to stay inside it. */
  bounds: ViewportBounds;
  children: React.ReactNode;
}

const GAP = 12;
const PAD = 8;

/**
 * Portals a floating toolbar to the body and positions it above the anchor,
 * flipping below when there isn't room, and clamped so it never leaves the
 * map area on any edge.
 */
export function ToolbarShell({ anchorX, anchorTop, anchorBottom, bounds, children }: ToolbarShellProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (s.w !== r.width || s.h !== r.height ? { w: r.width, h: r.height } : s));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const minLeft = bounds.left + PAD;
  const maxLeft = bounds.left + bounds.width - PAD - w;
  let left = anchorX - w / 2;
  left = Math.max(minLeft, Math.min(maxLeft, left));

  let top = anchorTop - GAP - h;
  if (top < bounds.top + PAD) top = anchorBottom + GAP; // flip below
  const maxTop = bounds.top + bounds.height - PAD - h;
  top = Math.max(bounds.top + PAD, Math.min(maxTop, top));

  return createPortal(
    <div
      ref={ref}
      className="border-separator1 bg-bg0 z-50 flex items-center gap-0.5 rounded-xl border p-1 shadow-xl"
      style={{
        position: 'fixed',
        left,
        top,
        // Hide until measured so it doesn't flash at the wrong spot.
        visibility: w === 0 ? 'hidden' : 'visible',
        maxWidth: Math.max(160, bounds.width - PAD * 2),
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
