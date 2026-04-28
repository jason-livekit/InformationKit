import * as React from 'react';

import type { ButtonProps } from '../../Button';
import { TaskButton } from '../../TaskButton';
import { useFormContext } from '../hooks/form-context';

export interface SubmitButtonProps extends ButtonProps {
  label: string;
  disabled?: boolean;
}

export default function SubmitButton({
  disabled,
  label,
  size = 'sm',
  variant = 'primary',
  className = '',
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(state) => ({ isSubmitting: state.isSubmitting, canSubmit: state.canSubmit })}
    >
      {(selectedState) => (
        <TaskButton
          {...props}
          size={size}
          variant={variant}
          type="submit"
          isPending={selectedState.isSubmitting}
          disabled={disabled || !selectedState.canSubmit}
          onClick={() => form.handleSubmit()}
          className={className}
        >
          {label}
        </TaskButton>
      )}
    </form.Subscribe>
  );
}
