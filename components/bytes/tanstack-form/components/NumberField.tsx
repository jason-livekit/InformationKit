import * as React from 'react';

import { Input, type InputProps } from '../../Input';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type NumberFieldProps = LabelWithHelpProps & Pick<InputProps, 'placeholder' | 'disabled'>;

export default function NumberField(props: NumberFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      <LabelWithHelp label={props.label} description={props.description} tooltip={props.tooltip} />
      <Input
        id={field.name}
        name={field.name}
        type="number"
        value={field.state.value === undefined ? '' : field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled || isSubmitting}
        className="text-xs"
      />
      <FieldErrors errors={errors} />
    </div>
  );
}
