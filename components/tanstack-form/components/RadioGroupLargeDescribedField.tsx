import * as React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type RadioGroupLargeDescribedFieldProps = LabelWithHelpProps & {
  options: Array<{
    value: string;
    label: string | React.ReactNode;
    description?: string;
  }>;
  readOnly?: boolean;
  disabled?: boolean;
};

export default function RadioGroupLargeDescribedField(props: RadioGroupLargeDescribedFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      {props.label ? (
        <LabelWithHelp size={props.size} label={props.label} description={props.description} />
      ) : null}
      <fieldset className="grid w-full grid-cols-2 gap-2">
        {props.options.map((option) => (
          <Label
            data-selected={field.state.value === option.value}
            key={option.value}
            className={cn(
              `text-fg2 data-[selected=true]:bg-bgAccent1 data-[selected=true]:text-fgAccent1 group flex w-full cursor-pointer gap-3 rounded p-2 font-normal transition-shadow duration-200 ease-in-out data-[selected=true]:font-semibold`,
              'border-separator1 data-[selected=true]:border-separatorAccent ring-offset-bg1 ring-accent1 border ring-offset-1',
              'data-[selected=true]:ring',
              props.readOnly
                ? 'text-fg4 data-[selected=true]:text-separatorAccent cursor-default'
                : 'data-[selected=true]:bg-bgAccent1',
              {
                'cursor-not-allowed opacity-50': isSubmitting,
              },
            )}
          >
            <div className="flex flex-1 flex-col gap-1 text-xs">
              <div className="font-semibold">{option.label}</div>
              {option.description && (
                <div className="text-fg3 group-data-[selected=true]:text-fgAccent2">
                  {option.description}
                </div>
              )}
            </div>
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
          </Label>
        ))}
      </fieldset>
      <FieldErrors errors={errors} />
    </div>
  );
}
