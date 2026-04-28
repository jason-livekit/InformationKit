import * as React from 'react';

import { cn } from '@/lib/bytes/utils';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-separator1 bg-bg1 font-display text-fg1 placeholder:text-fg4 flex h-8 w-full border-0 border-b py-1 text-base transition-colors focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
FormInput.displayName = 'FormInput';

export { FormInput };
