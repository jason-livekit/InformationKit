import * as React from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';

import { CheckIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { useFieldContext, useStore } from '../hooks/form-context';

type CheckboxToggleFieldProps = {
  label: string;
  className?: string;
  disabled?: boolean;
};

/*
 * A checkbox toggle field is a checkbox that is styled as a toggle button.
 * It is used to represent a boolean value that can be toggled on or off.
 * It is similar to a checkbox, but it is styled as a toggle button.
 * A boolean toogle can't have an error state, so we don't need to show an error message.
 */
export default function CheckboxToggleField(props: CheckboxToggleFieldProps) {
  const field = useFieldContext<CheckedState>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  return (
    <label
      htmlFor={field.name}
      className={cn(
        'border-separator2 bg-bg2 flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5',
        'has-[input:checked]:border-separatorAccent has-[input:checked]:bg-bgAccent1 has-[input:checked]:text-fgAccent1',
        'has-[input:disabled]:cursor-not-allowed',
        'transition-colors',
        props.className,
      )}
    >
      <input
        id={field.name}
        name={field.name}
        type="checkbox"
        checked={field.state.value === true}
        disabled={props.disabled || isSubmitting}
        onChange={(e) => field.handleChange(e.target.checked)}
        className="hidden"
      />
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded border transition-colors',
          field.state.value
            ? 'border-fgAccent1 bg-fgAccent1 text-bg1'
            : 'border-separator2 text-fgAccent1',
        )}
      >
        {field.state.value && <CheckIcon className="h-full w-full" />}
      </span>
      <div className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {props.label}
      </div>
    </label>
  );
}
