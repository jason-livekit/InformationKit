import * as React from 'react';
import * as _Form from '@radix-ui/react-form';

import { cn } from '@/lib/utils';

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#root} */
const Form = React.forwardRef<
  React.ComponentRef<typeof _Form.Root>,
  React.ComponentPropsWithoutRef<typeof _Form.Root>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Root className={cn('flex flex-col gap-4', className)} ref={ref} {...props}>
      {children}
    </_Form.Root>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#label} */
const FormField = React.forwardRef<
  React.ComponentRef<typeof _Form.Field>,
  React.ComponentPropsWithoutRef<typeof _Form.Field>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Field className={cn('flex flex-col gap-2', className)} ref={ref} {...props}>
      {children}
    </_Form.Field>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#label} */
const FormLabel = React.forwardRef<
  React.ComponentRef<typeof _Form.Label>,
  React.ComponentPropsWithoutRef<typeof _Form.Label>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Label className={cn('text-fg1 text-xs font-bold', className)} ref={ref} {...props}>
      {children}
    </_Form.Label>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#control} */
const FormControl = React.forwardRef<
  React.ComponentRef<typeof _Form.Control>,
  React.ComponentPropsWithoutRef<typeof _Form.Control>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Control className={cn('', className)} ref={ref} {...props}>
      {children}
    </_Form.Control>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#message} */
const FormMessage = React.forwardRef<
  React.ComponentRef<typeof _Form.Message>,
  React.ComponentPropsWithoutRef<typeof _Form.Message>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Message
      className={cn('text-xs text-red-400 peer-invalid:text-red-400', className)}
      ref={ref}
      {...props}
    >
      {children}
    </_Form.Message>
  );
});

const DefaultFormMessages = [
  <FormMessage key="valueMissing" match="valueMissing" />,
  <FormMessage key="badInput" match="badInput" />,
  <FormMessage key="tooLong" match="tooLong" />,
  <FormMessage key="tooShort" match="tooShort" />,
  <FormMessage key="typeMismatch" match="typeMismatch" />,
  <FormMessage key="stepMismatch" match="stepMismatch" />,
  <FormMessage key="rangeOverflow" match="rangeOverflow" />,
  <FormMessage key="rangeUnderflow" match="rangeUnderflow" />,
  <FormMessage key="patternMismatch" match="patternMismatch" />,
];

/** @see */
const FormValidityState = _Form.ValidityState;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/form#message} */
const FormSubmit = React.forwardRef<
  React.ComponentRef<typeof _Form.Submit>,
  React.ComponentPropsWithoutRef<typeof _Form.Submit>
>(({ className, children, ...props }, ref) => {
  return (
    <_Form.Submit className={cn('', className)} ref={ref} {...props}>
      {children}
    </_Form.Submit>
  );
});

export {
  DefaultFormMessages,
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormSubmit,
  FormValidityState,
};
