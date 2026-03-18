'use client';

import { createContext, startTransition, useContext, useEffect, useState } from 'react';

const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

const NUM_BREAKPOINTS = Object.keys(screens).length;

export enum Breakpoint {
  SM = 0,
  MD,
  LG,
  XL,
  '2XL',
}

type ScreenSizeState = {
  size: {
    width: number;
    height: number;
  } | null;
  breakpoint: Breakpoint | null;
};

const ScreenSizeContext = createContext<ScreenSizeState>({ size: null, breakpoint: null });

export function ScreenSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Normalize Tailwind screen values (e.g., "640px") to numbers for runtime comparison
    const screenWidths: number[] = Object.values(screens).map((value) =>
      typeof value === 'number' ? value : parseInt(String(value), 10),
    );

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let idx = 0;
      for (const value of screenWidths) {
        if (width < value || idx === NUM_BREAKPOINTS - 1) {
          startTransition(() => {
            setSize({ width, height });
            setBreakpoint(breakpointForIndex(idx));
          });
          return;
        }
        idx++;
      }
      startTransition(() => {
        setSize({ width, height });
        setBreakpoint(null);
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);
    return () => resizeObserver.unobserve(document.documentElement);
  }, []);

  return (
    <ScreenSizeContext.Provider value={{ size, breakpoint }}>{children}</ScreenSizeContext.Provider>
  );
}

export function useScreenSize(): {
  size: { width: number; height: number } | null;
  breakpoint: Breakpoint | null;
} {
  const screenSize = useContext(ScreenSizeContext);
  if (screenSize === undefined) {
    console.error('useBreakpoint must be used within a ScreenSizeProvider');
  }
  return screenSize;
}

function breakpointForIndex(index: number): Breakpoint {
  switch (index) {
    case 0:
      return Breakpoint.SM;
    case 1:
      return Breakpoint.MD;
    case 2:
      return Breakpoint.LG;
    case 3:
      return Breakpoint.XL;
    case 4:
      return Breakpoint['2XL'];
    default:
      console.error('Invalid breakpoint index:', index);
      return Breakpoint.LG;
  }
}
