import { useEffect, useRef, useState } from 'react';
import dotenv from 'dotenv';

import { PlusLargeIcon, TrashCanIcon } from '@/icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFieldContext, useStore } from '../hooks/form-context';
import { useStableKeyMapping } from '../hooks/form-helpers';
import { FieldErrors } from './shared/FieldErrors';

type RecordFieldProps = {
  entryLabel?: string;
  keyLabel?: string;
  keyPlaceholder?: string;
  valueLabel?: string;
  valuePlaceholder?: string;
  type?: 'text' | 'password';
  variant?: 'default' | 'borderless';
  disabled?: boolean;
  readOnly?: boolean;
  forbidAdd?: boolean;
  forbidRemove?: boolean;
  forbidModifyKeys?: boolean;
  forbidModifyKeysList?: string[];
};

export default function RecordField(props: RecordFieldProps) {
  const field = useFieldContext<Record<string, string>>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = useStore(field.form.store, (state) => reduceErrorRecord(field.name, state));
  const { entries, canAddEntry, updateKeyMapping } = useStableKeyMapping(field.state.value);

  return (
    <div className="w-full space-y-4">
      {entries.length > 0 && (
        <div
          className={cn('w-full', {
            'divide-separator1 border-separator1 divide-y rounded border':
              props.variant !== 'borderless',
            'space-y-3': props.variant === 'borderless',
          })}
        >
          {entries.map(({ id, key, value }) => (
            <RecordItem
              key={id}
              stableId={id}
              {...props}
              value={value}
              name={key}
              nameLabel={props.keyLabel || 'Key'}
              namePlaceholder={props.keyPlaceholder}
              valueLabel={props.valueLabel || 'Value'}
              disabled={props.disabled || isSubmitting}
              onKeyChange={updateKeyMapping}
              forbidModifyKeys={props.forbidModifyKeys || props.forbidModifyKeysList?.includes(key)}
            />
          ))}
        </div>
      )}
      <FieldErrors errors={errors} />
      {!props.forbidAdd && (
        <Button
          leftIcon={<PlusLargeIcon />}
          type="button"
          variant="secondary"
          size="sm"
          disabled={props.disabled || isSubmitting || !canAddEntry}
          onClick={() => {
            field.handleChange((previous) => ({ ...previous, '': '' }));
          }}
        >
          Add {props.entryLabel || 'entry'}
        </Button>
      )}
    </div>
  );
}

type RecordItemProps = {
  stableId: string;
  name: string;
  nameLabel: string;
  namePlaceholder?: string;
  value: string;
  valueLabel: string;
  valuePlaceholder?: string;
  type?: RecordFieldProps['type'];
  variant?: RecordFieldProps['variant'];
  disabled?: boolean;
  readOnly?: boolean;
  forbidAdd?: boolean;
  forbidRemove?: boolean;
  forbidModifyKeys?: boolean;
  onKeyChange: (oldKey: string, newKey: string) => void;
};

function RecordItem(props: RecordItemProps) {
  const field = useFieldContext<Record<string, string>>();
  const formKeyName = `${field.name}-${props.stableId}-key`;
  const formValueName = `${field.name}-${props.stableId}-value`;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nameRef = useRef(props.name);

  // Update ref when name prop changes (e.g., from external updates)
  useEffect(() => {
    nameRef.current = props.name;
  }, [props.name]);

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    field.handleChange((previous) => {
      if (newName === nameRef.current) {
        return previous;
      }
      if (newName && newName in previous) {
        window.alert('Key already exists');
        return previous;
      }
      const previousValue = previous[nameRef.current];
      if (previousValue === undefined) {
        return previous;
      }
      const newRecord = {
        ...previous,
      };
      if (newName) {
        newRecord[newName] = previousValue;
      }
      delete newRecord[nameRef.current];
      props.onKeyChange(nameRef.current, newName);
      nameRef.current = newName;
      return newRecord;
    });
  };

  const handlePasete = props.forbidAdd
    ? undefined
    : (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pasteData = event.clipboardData.getData('text');
        const record = parseRecord(pasteData);
        if (record && Object.keys(record).length > 0) {
          event.preventDefault();
          field.handleChange((previous) => {
            delete previous[''];
            return {
              ...previous,
              ...record,
            };
          });
        }
      };

  return (
    <div
      className={cn('flex items-start gap-4 p-4', {
        'px-0 py-0': props.variant === 'borderless',
      })}
    >
      <div className="flex grow flex-col gap-2">
        <Label htmlFor={formKeyName}>{props.nameLabel}</Label>
        <Input
          id={formKeyName}
          name={formKeyName}
          type="text"
          value={props.name}
          onChange={handleKeyChange}
          onPaste={handlePasete}
          placeholder={props.namePlaceholder}
          disabled={props.disabled}
          readOnly={props.readOnly || props.forbidModifyKeys}
          tabIndex={props.forbidModifyKeys ? -1 : 0}
          autoComplete="off"
          className="text-xs"
        />
      </div>
      <div className="flex grow flex-col gap-2">
        <Label htmlFor={formValueName}>{props.valueLabel}</Label>
        <div
          className={cn('flex items-center gap-4', {
            'grid grid-cols-[1fr_28px]': !props.forbidRemove,
          })}
        >
          <Input
            id={formValueName}
            name={formValueName}
            type={props.type || 'text'}
            value={props.value}
            onChange={(event) =>
              field.handleChange((previous) => ({
                ...previous,
                [props.name]: event.target.value,
              }))
            }
            placeholder={props.valuePlaceholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            autoComplete="new-password nosave"
            className="text-xs"
          />
          {!props.forbidRemove && (
            <Popover
              onOpenChange={(open) => {
                if (!open) {
                  setConfirmDelete(false);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  className="shrink-0"
                  variant={confirmDelete ? 'destructive' : 'ghost'}
                  size="icon"
                  leftIcon={<TrashCanIcon className="size-4" />}
                  disabled={props.disabled}
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                      return;
                    }
                    field.handleChange((previous) => {
                      const newRecord = { ...previous };
                      delete newRecord[props.name];
                      return newRecord;
                    });
                    setConfirmDelete(false);
                  }}
                >
                  <span className="sr-only">Delete entry</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" className="p-2 text-xs">
                Click again to confirm delete
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}

function parseRecord(text: string): Record<string, string> | null {
  try {
    const parsed = dotenv.parse(text);
    return parsed;
  } catch {
    return null;
  }
}

function reduceErrorRecord(fieldName: string, state: { errors: any[] }) {
  return Array.from(
    state.errors
      .filter((errMap) => Object.keys(errMap).some((key) => key.startsWith(`${fieldName}.`)))
      .reduce<Set<string>>((errSet, err) => {
        for (const value of Object.values(err)) {
          if (typeof value === 'string') {
            errSet.add(value);
          } else if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === 'string') {
                errSet.add(v);
              } else if (v && typeof v.message === 'string') {
                errSet.add(v.message);
              }
            });
          }
        }
        return errSet;
      }, new Set<string>()),
  );
}
