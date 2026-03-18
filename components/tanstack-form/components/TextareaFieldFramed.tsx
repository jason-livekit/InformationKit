import React from 'react';

import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

export type TextareaFieldFramedProps = Omit<LabelWithHelpProps, 'label'> & {
  label?: string;
  children: React.ReactNode;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  hasToggle?: boolean;
};

const TextareaFieldFramed = React.forwardRef<HTMLInputElement, TextareaFieldFramedProps>(
  ({ className, children, ...props }, ref) => {
    const field = useFieldContext<string>();
    const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
    const errors = field.state.meta.errors;

    return (
      <div className={cn('flex flex-col gap-2 rounded', className)}>
        {props.label ? (
          <LabelWithHelp
            label={props.label}
            description={props.description}
            tooltip={props.tooltip}
            size={props.size}
          />
        ) : null}
        <div className="border-separator1 rounded-md border">
          <div className="border-separator1 bg-bg2 rounded-tl rounded-tr border-b">{children}</div>
          <Textarea
            id={field.name}
            name={field.name}
            rows={props.rows}
            value={field.state.value === undefined ? '' : field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled || isSubmitting}
            size={'medium'}
            hasBorder={false}
          />
        </div>
        <FieldErrors errors={errors} />
      </div>
    );
  },
);

export default TextareaFieldFramed;
