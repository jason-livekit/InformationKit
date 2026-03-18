import * as React from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

export type SelectFieldProps = LabelWithHelpProps & {
  label?: React.ReactNode;
  options: Array<{
    value: string;
    label: string | React.ReactNode;
    description?: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
};

export default function SelectField(props: SelectFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      <LabelWithHelp
        label={props.label}
        description={props.description}
        tooltip={props.tooltip}
        size={props.size}
      />
      <fieldset className="flex gap-2">
        <Select
          value={field.state.value}
          onValueChange={(value) => field.handleChange(value)}
          disabled={props.disabled || isSubmitting}
        >
          <SelectTrigger className="h-8 w-full px-3 py-1 text-xs">
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent className="max-w-min">
            {props.options.map((option) => (
              <SelectItem
                value={option.value}
                key={option.value}
                description={option.description}
                disabled={option.disabled}
                className="text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <FieldErrors errors={errors} />
    </div>
  );
}
