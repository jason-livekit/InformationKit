import * as React from 'react';

import { cn } from '@/lib/bytes/utils';
import { Switch } from '../../Switch';
import type { SwitchFieldProps } from './SwitchField';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';

type SwitchDescribedFieldProps = Omit<SwitchFieldProps, 'label'> & {
  label?: React.ReactNode;
};

export default function SwitchDescribedField(props: SwitchDescribedFieldProps) {
  const field = useFieldContext<boolean>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <label
      aria-disabled={props.disabled || isSubmitting}
      className={cn('flex items-center gap-6 p-3 rounded border border-separator1 bg-bg2', {
        'cursor-pointer hover:border-separator2 hover:bg-bg3 select-none':
          !props.disabled && !isSubmitting,
        'cursor-not-allowed opacity-50': props.disabled || isSubmitting,
      })}
      htmlFor={field.name}
    >
      {props.label ? (
        <div className="text-fg1 space-y-0.5 text-xs font-semibold">
          {props.label}
          {props.description ? <div className="text-fg3 text-xs">{props.description}</div> : null}
        </div>
      ) : null}
      <div className={cn('flex items-center', props.className)}>
        <Switch
          id={field.name}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
          disabled={props.disabled || isSubmitting}
          stateLabels={props.stateLabels}
        />
      </div>
      <FieldErrors errors={errors} />
    </label>
  );
}
