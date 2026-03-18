import * as React from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui/input';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type TextFieldProps = LabelWithHelpProps &
  Pick<
    InputProps,
    'className' | 'placeholder' | 'readOnly' | 'onBlur' | 'maxLength' | 'pattern'
  > & {
    type?: 'text' | 'email' | 'password' | 'date' | 'month' | 'number';
    size?: 'small' | 'medium';
    prefix?: ReactNode;
    affix?: ReactNode;
    disabled?: boolean;
  };

export default function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const type = props.type ?? 'text';
  const size = props.size ?? 'small';
  const errors = field.state.meta.errors;
  const value = field.state.value === undefined ? '' : field.state.value;

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <LabelWithHelp
        size={size}
        label={props.label}
        description={props.description}
        tooltip={props.tooltip}
      />
      <div className="relative inline-flex items-center gap-2">
        {props.prefix}
        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={value}
          onChange={(event) => field.handleChange(event.target.value)}
          placeholder={props.placeholder}
          disabled={props.disabled || isSubmitting}
          readOnly={props.readOnly}
          className="text-xs"
          onBlur={props.onBlur}
          maxLength={props.maxLength}
          pattern={props.pattern}
        />
        {props.affix}
      </div>
      <FieldErrors errors={errors} />
    </div>
  );
}
