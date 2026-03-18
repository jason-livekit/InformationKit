import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type RadioGroupLargeField = LabelWithHelpProps & {
  options: Array<{
    value: string;
    label: string | React.ReactNode;
  }>;
  readOnly?: boolean;
  disabled?: boolean;
};

export default function RadioGroupLargeField(props: RadioGroupLargeField) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      <LabelWithHelp label={props.label} description={props.description} />
      <fieldset className="grid w-full grid-cols-2 gap-2">
        {props.options.map((option) => (
          <Label
            data-selected={field.state.value === option.value}
            key={option.value}
            className={cn(
              `border-separator1 text-fg2 data-[selected=true]:border-separatorAccent data-[selected=true]:bg-bgAccent1 data-[selected=true]:text-fgAccent1 group flex w-full cursor-pointer items-center gap-3 rounded border px-3 py-1.5 leading-[18px] font-normal data-[selected=true]:font-semibold`,
              props.readOnly
                ? 'text-fg4 data-[selected=true]:text-separatorAccent cursor-default'
                : 'data-[selected=true]:bg-bgAccent1',
            )}
          >
            <Input
              readOnly={props.readOnly}
              disabled={props.disabled || props.readOnly || isSubmitting}
              className="group-data-[selected=false]:accent-fgAccent1! group-data-[selected=true]:accent-fgAccent1! h-3 w-min justify-start group-data-[disabled=true]:cursor-not-allowed"
              id={`${field.name}-${option.value}`}
              name={field.name}
              type="radio"
              value={option.value}
              checked={field.state.value === option.value}
              onChange={() => field.handleChange(option.value)}
            />
            {option.label}
          </Label>
        ))}
      </fieldset>
      <FieldErrors errors={errors} />
    </div>
  );
}
