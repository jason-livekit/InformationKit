import { lazy } from 'react';
import { createFormHook } from '@tanstack/react-form';

import { fieldContext, formContext } from './form-context';

const ComboboxField = lazy(() => import('../components/ComboboxField'));
const CheckboxField = lazy(() => import('../components/CheckboxField'));
const CheckboxToggleField = lazy(() => import('../components/CheckboxToggleField'));
const HiddenField = lazy(() => import('../components/HiddenField'));
const MultiselectWithSearch = lazy(() => import('../components/MultiselectWithSearch'));
const NumberField = lazy(() => import('../components/NumberField'));
const RadioButtonField = lazy(() => import('../components/RadioButtonField'));
const RadioGroupLargeDescribedField = lazy(
  () => import('../components/RadioGroupLargeDescribedField'),
);
const RadioGroupLargeField = lazy(() => import('../components/RadioGroupLargeField'));
const RecordField = lazy(() => import('../components/RecordField'));
const SchemaField = lazy(() => import('../components/SchemaField'));
const SelectField = lazy(() => import('../components/SelectField'));
const SelectWithSearch = lazy(() => import('../components/SelectWithSearch'));
const SubmitButton = lazy(() => import('../components/SubmitButton'));
const SwitchField = lazy(() => import('../components/SwitchField'));
const SwitchDescribedField = lazy(() => import('../components/SwitchDescribedField'));
const TextField = lazy(() => import('../components/TextField'));
const TextareaField = lazy(() => import('../components/TextareaField'));
const TextareaFieldFramed = lazy(() => import('../components/TextareaFieldFramed'));

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    ComboboxField,
    CheckboxField,
    CheckboxToggleField,
    HiddenField,
    MultiselectWithSearch,
    NumberField,
    RadioButtonField,
    RadioGroupLargeDescribedField,
    RadioGroupLargeField,
    RecordField,
    SchemaField,
    SelectField,
    SelectWithSearch,
    SwitchField,
    SwitchDescribedField,
    TextField,
    TextareaField,
    TextareaFieldFramed,
  },
  formComponents: {
    SubmitButton,
  },
});
