import { useEffect, useState } from 'react';
import * as React from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { createKeybindingsHandler } from 'tinykeys';

import { SearchIcon } from '@/icons/react/central-line';
import { Checkbox } from '../../Checkbox';
import { Input } from '../../Input';
import { Label } from '../../Label';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { type LabelWithHelpProps } from './shared/LabelWithHelp';

type MultiselectWithSearchProps = LabelWithHelpProps & {
  options: { label: string; value: string }[];
  /** The separator to use for the values. Defaults to `,`. */
  separator?: string;
  placeholder?: string;
  /** The message to display when there are no options. */
  noOptionsMessage?: string;
  /** The message to display when there are no options left after filtering. */
  noResultsMessage?: string;
  /** If true, the option value will be used as the secondary label. */
  valueAsSecondaryLabel?: boolean;
  disabled?: boolean;
};

export default function MultiselectWithSearch(props: MultiselectWithSearchProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const separator = props.separator ?? ',';
  const errors = field.state.meta.errors;
  const [searchQuery, setSearchQuery] = useState('');

  const options = props.options.map((option) => ({
    ...option,
    label: option.label,
  }));

  const selectedValues = field.state.value
    .split(separator)
    .map((value) => value.trim())
    .filter((value) => value !== '');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const handleChange = React.useCallback(
    (option: { label: string; value: string }, checked: CheckedState) => {
      const current = field.state.value
        .split(separator)
        .map((v) => v.trim())
        .filter((v) => v !== '');
      if (checked === 'indeterminate' || checked === false) {
        field.handleChange(current.filter((value) => value !== option.value).join(separator));
      } else {
        field.handleChange([...current, option.value].join(separator));
      }
    },
    [field, separator],
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRefs = React.useRef<HTMLButtonElement[]>([]);
  const ulRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    let handler = createKeybindingsHandler({
      ArrowDown: () => {
        if (listRefs.current.length < 1) {
          return;
        }
        const active = document.activeElement;
        const index = listRefs.current.findIndex((el) => el === active);

        if (active === inputRef.current) {
          // Focus the first item without scrolling
          listRefs.current[0]?.focus({ preventScroll: true });
          // Ensure the list doesn't scroll by maintaining the current scroll position
          setTimeout(() => {
            ulRef.current?.scrollTo({ top: 0, behavior: 'instant' });
          }, 100);
        } else if (index >= 0 && index < listRefs.current.length - 1) {
          listRefs.current[index + 1]?.focus();
        }
      },
      ArrowUp: () => {
        if (listRefs.current.length < 1) {
          return;
        }
        const active = document.activeElement;
        const index = listRefs.current.findIndex((el) => el === active);

        if (index === 0) {
          inputRef.current?.focus();
        } else if (index > 0) {
          listRefs.current[index - 1]?.focus();
        }
      },
    });

    if (inputRef.current) {
      containerRef.current?.addEventListener('keydown', handler);
    }
    return () => {
      if (inputRef.current) {
        containerRef.current?.removeEventListener('keydown', handler);
      }
    };
  }, []);

  return (
    <div className="border-separator2 flex flex-col rounded" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={props.placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="z-10 w-full rounded-b-none p-2 pl-8 text-xs focus-visible:ring-offset-0"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
            }
          }}
          disabled={props.disabled || isSubmitting}
        />
        <SearchIcon className="text-fg4 pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
      </div>
      <ul
        ref={ulRef}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
          }
        }}
        className="border-separator2 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-b border border-t-0 p-2"
      >
        {options.length === 0 ? (
          <li className="text-fg4 flex items-center justify-center text-xs">
            {props.noOptionsMessage ?? '—'}
          </li>
        ) : filteredOptions.length === 0 ? (
          <li className="text-fg4 flex items-center justify-center text-xs">
            {props.noResultsMessage ?? 'No results found'}
          </li>
        ) : (
          filteredOptions.map((option, index) => (
            <li key={index} className="flex items-center gap-2">
              <Checkbox
                ref={(el) => {
                  if (el) {
                    listRefs.current[index] = el;
                  }
                }}
                id={`${field.name}-${index}`}
                name={field.name}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={(checked) => handleChange(option, checked)}
                disabled={isSubmitting}
              />
              <Label
                htmlFor={`${field.name}-${index}`}
                className="text-fg2 flex w-full cursor-pointer items-center justify-between truncate font-sans font-normal"
                title={option.label}
              >
                <span className="text-fg2 truncate leading-4">{option.label}</span>
                {props.valueAsSecondaryLabel && (
                  <span className="text-fg4 shrink truncate text-xs">{option.value}</span>
                )}
              </Label>
            </li>
          ))
        )}
      </ul>
      <FieldErrors errors={errors} />
    </div>
  );
}
