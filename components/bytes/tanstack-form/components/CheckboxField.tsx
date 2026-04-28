import * as React from 'react';
import type { CheckedState } from '@radix-ui/react-checkbox';

import { cn } from '@/lib/bytes/utils';
import { Checkbox } from '../../Checkbox';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type CheckboxFieldProps = LabelWithHelpProps & {
  className?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  checkBoxClassName?: string;
};

export default function CheckboxField(props: CheckboxFieldProps) {
  const field = useFieldContext<CheckedState>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <div className={cn('flex items-center', props.size === 'small' ? 'gap-2' : 'gap-1')}>
        <Checkbox
          id={field.name}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
          disabled={props.disabled || isSubmitting}
          className={props.checkBoxClassName}
        />
        <LabelWithHelp
          label={props.label}
          description={props.description}
          tooltip={props.tooltip}
          size={props.size}
          className="font-normal" // Label beside checkbox should not be bold, unlike superfixial input labels
        />
      </div>
      <FieldErrors errors={errors} />
    </div>
  );
}
