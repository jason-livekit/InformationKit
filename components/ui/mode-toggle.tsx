'use client';

import * as React from 'react';
import type { UseThemeProps } from 'next-themes';

import {
  MoonIcon,
  MoonSolidIcon,
  StudioDisplayIcon,
  StudioDisplaySolidIcon,
  SunIcon,
  SunSolidIcon,
} from '@/icons/react';
import { useTheme } from '@/lib/theme';

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="border-separator1 inline-flex overflow-hidden rounded-sm border">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={getButtonClass('light', theme)}
        aria-label="Light theme"
      >
        {theme === 'light' ? (
          <SunSolidIcon className="h-4 w-4" />
        ) : (
          <SunIcon className="h-4 w-4" />
        )}
      </button>
      <div className="bg-separator1 w-px" />
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={getButtonClass('dark', theme)}
        aria-label="Dark theme"
      >
        {theme === 'dark' ? (
          <MoonSolidIcon className="h-4 w-4" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )}
      </button>
      <div className="bg-separator1 w-px" />
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={getButtonClass('system', theme)}
        aria-label="System theme"
      >
        {theme === 'system' ? (
          <StudioDisplaySolidIcon className="h-4 w-4" />
        ) : (
          <StudioDisplayIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function getButtonClass(theme: 'light' | 'dark' | 'system', currentTheme: UseThemeProps['theme']) {
  const baseClass =
    'group flex items-center justify-center px-2 py-1 text-xs font-medium transition-colors';
  const activeClass = 'bg-bg2 text-fg0';
  const inactiveClass = 'text-fg2 hover:text-fg0 hover:bg-bg2';
  return `${baseClass} ${currentTheme === theme ? activeClass : inactiveClass}`;
}
