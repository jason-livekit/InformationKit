'use client';

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonSolidIcon, SunSolidIcon, StudioDisplaySolidIcon } from "@/icons/react";
import { Button } from "@/components/bytes/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/bytes/Popover";

/**
 * A theme toggle that doesn't depend on SidebarProvider.
 * Used in layouts that don't have the app sidebar (e.g., /components showcase).
 */
export function ThemeToggleStandalone() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? resolvedTheme : undefined;

  const getThemeIcon = () => {
    if (!mounted) return <StudioDisplaySolidIcon className="h-4 w-4" />;
    switch (activeTheme) {
      case 'light': return <SunSolidIcon className="h-4 w-4" />;
      case 'dark': return <MoonSolidIcon className="h-4 w-4" />;
      default: return <StudioDisplaySolidIcon className="h-4 w-4" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Current theme: ${mounted ? activeTheme || 'system' : 'loading'}. Click to change theme.`}
        >
          {getThemeIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40" align="end">
        <div className="space-y-1">
          {[
            { value: 'light', label: 'Light', Icon: SunSolidIcon },
            { value: 'dark', label: 'Dark', Icon: MoonSolidIcon },
            { value: 'system', label: 'System', Icon: StudioDisplaySolidIcon },
          ].map(({ value, label, Icon }) => (
            <Button
              key={value}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setTheme(value)}
              data-active={theme === value}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
