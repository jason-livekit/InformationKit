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
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reflect the *selected* mode (light / dark / system) — not the resolved one — so the
  // System option shows the system icon instead of a sun/moon.
  const selectedTheme = mounted ? theme ?? 'system' : undefined;

  const getThemeIcon = () => {
    switch (selectedTheme) {
      case 'light': return <SunSolidIcon className="h-4 w-4" />;
      case 'dark': return <MoonSolidIcon className="h-4 w-4" />;
      default: return <StudioDisplaySolidIcon className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Current theme: ${mounted ? selectedTheme : 'loading'}. Click to change theme.`}
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
              className="w-full cursor-pointer justify-start hover:bg-bg3! dark:hover:bg-bg2! data-[active=true]:bg-bg3! dark:data-[active=true]:bg-bg2! data-[active=true]:text-fg0"
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
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
