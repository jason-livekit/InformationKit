import { cn } from '@/lib/bytes';
import type { ComboboxOption } from '../../Combobox';
import { Combobox } from '../../Combobox';
import { useFieldContext, useStore } from '../hooks/form-context';
import { FieldErrors } from './shared/FieldErrors';
import { LabelWithHelp, type LabelWithHelpProps } from './shared/LabelWithHelp';

type ComboboxFieldProps = LabelWithHelpProps & {
  options: ComboboxOption[];
  placeholder?: string;
  onOpenChange?: (open: boolean) => void;
  noOptionsMessage?: string;
  noResultsMessage?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
};

export default function ComboboxField(props: ComboboxFieldProps) {
  const field = useFieldContext<string>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;

  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <LabelWithHelp
        label={props.label}
        description={props.description}
        tooltip={props.tooltip}
        size={props.size}
      />
      <Combobox
        options={props.options}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        onOpenChange={props.onOpenChange}
        placeholder={props.placeholder}
        noOptionsMessage={props.noOptionsMessage}
        noResultsMessage={props.noResultsMessage}
        disabled={props.disabled || isSubmitting}
      />
      <FieldErrors errors={errors} />
    </div>
  );
}
