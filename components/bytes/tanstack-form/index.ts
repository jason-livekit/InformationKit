import type { FormAsyncValidateOrFn, FormValidateOrFn } from '@tanstack/react-form';

import { useAppForm } from './hooks/form';

export { formOptions } from '@tanstack/react-form';

export type Form<FormData, SubmitMeta = {}> = ReturnType<
  typeof useAppForm<
    FormData,
    FormValidateOrFn<FormData> | undefined,
    FormValidateOrFn<FormData> | undefined,
    FormAsyncValidateOrFn<FormData> | undefined,
    FormValidateOrFn<FormData> | undefined,
    FormAsyncValidateOrFn<FormData> | undefined,
    FormValidateOrFn<FormData> | undefined,
    FormAsyncValidateOrFn<FormData> | undefined,
    FormValidateOrFn<FormData> | undefined,
    FormAsyncValidateOrFn<FormData> | undefined,
    FormAsyncValidateOrFn<FormData> | undefined,
    SubmitMeta
  >
>;

export { useAppForm } from './hooks/form';
export * from './hooks/form-context';
export { LabelWithHelp } from './components/shared/LabelWithHelp';
export { FieldErrors } from './components/shared/FieldErrors';
export { CollapsibleFormSection } from './components/layout/CollapsibleFormSection';
export { FormSection } from './components/layout/FormSection';
export * from './components/SchemaField';
export type { SelectFieldProps } from './components/SelectField';
