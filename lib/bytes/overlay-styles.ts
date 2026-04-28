/**
 * Shared Tailwind class strings for overlay menus (Select, DropdownMenu, Combobox, etc.) to ensure
 * visual consistency across all menu-like components.
 */

/** Base styles for overlay content containers (popover, dropdown, select panels). */
export const overlayContentStyles =
  'border-separator1 bg-bg2 text-fg1 z-50 min-w-32 overflow-hidden rounded border p-1 drop-shadow-md';

/** Animation styles for overlay content open/close transitions. */
export const overlayContentAnimationStyles =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/** Base styles for selectable items within overlay menus. */
export const overlayItemStyles =
  'text-fg1 hover:bg-bg3 focus:bg-bg3 relative flex w-full cursor-default items-center rounded py-1.5 pr-8 pl-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50';
