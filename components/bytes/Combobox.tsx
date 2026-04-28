'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CheckIcon } from '@/components/bytes';

import {
  overlayContentAnimationStyles,
  overlayContentStyles,
  overlayItemStyles,
} from '@/lib/bytes/overlay-styles';
import { cn } from '@/lib/bytes/utils';
import { Input } from './Input';
import { ScrollArea } from './ScrollArea';

export type ComboboxOption = {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
};

/**
 * Renders a label with the matching substring highlighted.
 * If searchText is empty or no match is found, returns the label as-is.
 */
function HighlightedLabel({
  label,
  searchText,
}: {
  label: string;
  searchText: string;
}): React.ReactNode {
  if (!searchText) {
    return label;
  }

  const lowerLabel = label.toLowerCase();
  const lowerSearch = searchText.toLowerCase();
  const matchIndex = lowerLabel.indexOf(lowerSearch);

  if (matchIndex === -1) {
    return label;
  }

  const beforeMatch = label.slice(0, matchIndex);
  const match = label.slice(matchIndex, matchIndex + searchText.length);
  const afterMatch = label.slice(matchIndex + searchText.length);

  return (
    <>
      {beforeMatch}
      <span className="text-fgAccent1">{match}</span>
      {afterMatch}
    </>
  );
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  noResultsMessage?: string;
  disabled?: boolean;
  className?: string;
}

const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      onOpenChange,
      placeholder = 'Search...',
      noOptionsMessage = '\u2014',
      noResultsMessage = 'No results found',
      disabled,
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      onOpenChange?.(open);
    }, [open]);

    // Resolve the display label for the current value: use the matching option's label if
    // one exists, otherwise fall back to the raw value (arbitrary text).
    const displayLabel = options.find((o) => o.value === value)?.label ?? value ?? '';

    const filteredOptions = React.useMemo(
      () =>
        options.filter((option) => option.label.toLowerCase().includes(inputValue.toLowerCase())),
      [options, inputValue],
    );

    function handleSelect(option: ComboboxOption) {
      onValueChange?.(option.value);
      setInputValue(option.label);
      setOpen(false);
      inputRef.current?.blur();
    }

    function commitInputValue() {
      const text = inputValue.trim();
      // If the text exactly matches an option label, commit its value.
      const match = options.find((o) => o.label.toLowerCase() === text.toLowerCase());
      onValueChange?.(match ? match.value : text);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      setInputValue(e.target.value);
      if (!open) setOpen(true);
    }

    function handleFocus() {
      setInputValue(displayLabel);
      setOpen(true);
      // Select all text on focus so the user can start typing to replace.
      requestAnimationFrame(() => inputRef.current?.select());
    }

    function handleBlur(e: React.FocusEvent) {
      // Don't close if focus moved into the dropdown content.
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (contentRef.current?.contains(relatedTarget)) return;
      commitInputValue();
      setOpen(false);
    }

    function handleInputKeyDown(e: React.KeyboardEvent) {
      if (e.key === 'Escape') {
        setInputValue(displayLabel);
        setOpen(false);
        inputRef.current?.blur();
        return;
      }

      if (e.key === 'ArrowDown' && open) {
        e.preventDefault();
        const items = contentRef.current?.querySelectorAll<HTMLElement>(
          '[role="option"]:not([aria-disabled="true"])',
        );
        items?.[0]?.focus();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // If exactly one option matches, select it; otherwise commit the raw text.
        if (filteredOptions.length === 1 && !filteredOptions[0]!.disabled) {
          handleSelect(filteredOptions[0]!);
        } else {
          commitInputValue();
          setOpen(false);
          inputRef.current?.blur();
        }
      }
    }

    return (
      <PopoverPrimitive.Root open={open}>
        <PopoverPrimitive.Anchor asChild>
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            placeholder={placeholder}
            value={open ? inputValue : displayLabel}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            className={cn('text-xs', className)}
          />
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Content
          ref={contentRef}
          align="start"
          sideOffset={8}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Prevent Radix from closing on outside interactions — we manage
          // open state via the input's focus/blur handlers.
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            overlayContentStyles,
            overlayContentAnimationStyles,
            'w-[var(--radix-popper-anchor-width)] p-0 text-xs',
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          )}
        >
          <ScrollArea className="max-h-48">
            <div className="p-1" role="listbox">
              {options.length === 0 ? (
                <div className="text-fg4 flex items-center justify-center p-2 text-xs">
                  {noOptionsMessage}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-fg4 flex items-center justify-center p-2 text-xs">
                  {noResultsMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={value === option.value}
                    aria-disabled={option.disabled}
                    tabIndex={option.disabled ? undefined : -1}
                    className={cn(
                      overlayItemStyles,
                      'cursor-pointer transition-colors',
                      option.disabled && 'pointer-events-none opacity-50',
                    )}
                    onClick={() => {
                      if (!option.disabled) handleSelect(option);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
                        if (prev) {
                          prev.focus();
                        } else {
                          inputRef.current?.focus();
                        }
                      } else if ((e.key === 'Enter' || e.key === ' ') && !option.disabled) {
                        e.preventDefault();
                        handleSelect(option);
                      } else if (e.key === 'Escape') {
                        setInputValue(displayLabel);
                        setOpen(false);
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    <div className="flex flex-col gap-0.5 truncate">
                      <span className="truncate">
                        <HighlightedLabel label={option.label} searchText={inputValue} />
                      </span>
                      {option.description && (
                        <span className="text-fg4 truncate text-xs">{option.description}</span>
                      )}
                    </div>
                    {value === option.value && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        <CheckIcon className="text-fgAccent1 h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    );
  },
);
Combobox.displayName = 'Combobox';

export { Combobox };
