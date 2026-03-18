import * as React from 'react';

import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { SwitchProps } from '@/components/ui/switch';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type SwitchFieldProps = Omit<LabelWithHelpProps, 'label'> &
  Pick<SwitchProps, 'stateLabels'> & {
    label?: string;
    className?: string;
    disabled?: boolean;
    size?: 'small' | 'medium';
    inline?: boolean;
  };

export default function SwitchField(props: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div
      className={cn('flex flex-col gap-2', {
        'items-center gap-2 md:flex-row': props.inline,
      })}
    >
      {props.label ? (
        <LabelWithHelp
          label={props.label}
          description={props.description}
          tooltip={props.tooltip}
          size={props.size}
        />
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
    </div>
  );
}
