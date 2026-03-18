import * as React from 'react';

import { Input } from '@/components/ui/input';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type RadioButtonFieldProps = LabelWithHelpProps & {
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
};

export default function RadioButtonField(props: RadioButtonFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      <LabelWithHelp label={props.label} description={props.description} tooltip={props.tooltip} />
      <fieldset className="text-fg1 flex gap-4 text-sm">
        {props.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <Input
              id={`${field.name}-${option.value}`}
              name={field.name}
              type="radio"
              value={option.value}
              checked={field.state.value === option.value}
              onChange={() => field.handleChange(option.value)}
              disabled={props.disabled || isSubmitting}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <FieldErrors errors={errors} />
    </div>
  );
}
