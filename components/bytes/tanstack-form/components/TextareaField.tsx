import * as React from 'react';

import { cn } from '@/lib/bytes';
import { Textarea, type TextareaProps } from '../../Textarea';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type TextareaFieldProps = LabelWithHelpProps &
  Pick<TextareaProps, 'placeholder' | 'disabled'> & {
    rows?: number;
    size?: 'small' | 'medium';
    hasBorder?: boolean;
  };

export default function TextareaField(props: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <LabelWithHelp
        label={props.label}
        description={props.description}
        tooltip={props.tooltip}
        size={props.size}
      />
      <Textarea
        id={field.name}
        name={field.name}
        rows={props.rows}
        value={field.state.value === undefined ? '' : field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled || isSubmitting}
        size={props.size}
        hasBorder={props.hasBorder}
      />
      <FieldErrors errors={errors} />
    </div>
  );
}
