import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { PlusLargeIcon, TrashCanIcon } from '@/icons/react';
import { cn } from '@/lib/bytes';
import { Button } from '../../Button';
import { Checkbox } from '../../Checkbox';
import { ToggleTip } from '../../ToggleTip';
import { Input } from '../../Input';
import { Label } from '../../Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../Select';
import { useFieldContext, useStore } from '../hooks/form-context';
import { useStableKeyMapping } from '../hooks/form-helpers';
import { FieldErrors } from './shared/FieldErrors';

export type SchemaFieldProps = {
  keyLabel?: string;
  keyTooltip?: string;
  keyPlaceholder?: string;
  defaultLabel?: string;
  defaultTooltip?: string;
  defaultPlaceholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export enum SchemaFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export const Schema = z.record(
  z.string(),
  z.union([
    z.object({
      type: z.literal(SchemaFieldType.STRING),
      name: z.string(),
      default: z.string().optional(),
    }),
    z.object({
      type: z.literal(SchemaFieldType.NUMBER),
      name: z.string(),
      default: z.number().optional(),
    }),
    z.object({
      type: z.literal(SchemaFieldType.BOOLEAN),
      name: z.string(),
      default: z.boolean().default(false),
    }),
  ]),
);

export type SchemaField = z.output<typeof Schema>[string];

export default function SchemaField(props: SchemaFieldProps) {
  const field = useFieldContext<z.infer<typeof Schema>>();
  const isSubmitting = useStore(field.form.store, (state) => state.isSubmitting);
  const errors = field.state.meta.errors;
  const { entries, updateKeyMapping } = useStableKeyMapping(field.state.value);

  return (
    <div className="w-full space-y-4">
      {entries.length > 0 && (
        <div className="divide-separator1 border-separator1 w-full divide-y rounded border">
          {entries.map(({ id, key, value }) => (
            <SchemaItem
              key={id}
              stableId={id}
              name={key}
              schemaField={value}
              {...props}
              disabled={props.disabled || isSubmitting}
              onKeyChange={updateKeyMapping}
            />
          ))}
        </div>
      )}
      <Button
        leftIcon={<PlusLargeIcon />}
        type="button"
        variant="secondary"
        size="sm"
        disabled={props.disabled || isSubmitting}
        onClick={() => {
          field.handleChange((previous) => ({
            ...previous,
            '': {
              type: SchemaFieldType.STRING,
              name: 'TODO',
              default: '',
            },
          }));
        }}
      >
        Add variable
      </Button>
      <FieldErrors errors={errors} />
    </div>
  );
}

type SchemaItemProps = SchemaFieldProps & {
  stableId: string;
  schemaField: SchemaField;
  name: string;
  onKeyChange: (oldKey: string, newKey: string) => void;
};

function SchemaItem(props: SchemaItemProps) {
  const field = useFieldContext<z.infer<typeof Schema>>();
  const formKeyName = `${field.name}-${props.stableId}-key`;
  const formTypeName = `${field.name}-${props.stableId}-type`;
  const formValueName = `${field.name}-${props.stableId}-value`;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyError, setKeyError] = useState<string | undefined>(undefined);

  const nameRef = useRef(props.name);

  // Update ref when name prop changes (e.g., from external updates)
  useEffect(() => {
    nameRef.current = props.name;
  }, [props.name]);

  return (
    <div className="grid grid-cols-[90px_1fr_1fr] items-start gap-4 p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={formTypeName}>Type</Label>
        <Select
          name={formTypeName}
          value={props.schemaField.type}
          size="sm"
          onValueChange={(newType) => {
            field.handleChange((previous) => {
              const previousField =
                previous[props.name] ??
                ({
                  type: newType as SchemaFieldType,
                  name: '',
                  default:
                    newType === SchemaFieldType.BOOLEAN
                      ? false
                      : newType === SchemaFieldType.NUMBER
                        ? 0
                        : '',
                } as any);
              let newValue: SchemaField;
              switch (newType) {
                case SchemaFieldType.BOOLEAN:
                  newValue = {
                    type: SchemaFieldType.BOOLEAN,
                    name: previousField.name,
                    default: Boolean(previousField.default),
                  };
                  break;
                case SchemaFieldType.NUMBER:
                  newValue = {
                    type: SchemaFieldType.NUMBER,
                    name: previousField.name,
                    default: Number(previousField.default) || 0,
                  };
                  break;
                case SchemaFieldType.STRING:
                default:
                  newValue = {
                    type: SchemaFieldType.STRING,
                    name: previousField.name,
                    default:
                      typeof previousField.type === SchemaFieldType.BOOLEAN
                        ? ''
                        : String(previousField.default) || '',
                  };
                  break;
              }
              return {
                ...previous,
                [props.name]: newValue,
              };
            });
          }}
          disabled={props.disabled}
        >
          <SelectTrigger className="mt-0.5">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SchemaFieldType.STRING}>String</SelectItem>
            <SelectItem value={SchemaFieldType.NUMBER}>Number</SelectItem>
            <SelectItem value={SchemaFieldType.BOOLEAN}>Boolean</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex grow flex-col gap-2">
        <Label
          htmlFor={formKeyName}
          className={cn('flex items-center gap-1', {
            'h-3': !!props.keyTooltip,
          })}
        >
          {props.keyLabel ?? 'Name'}
          {props.keyTooltip ? <ToggleTip>{props.keyTooltip}</ToggleTip> : null}
        </Label>
        <Input
          id={formKeyName}
          name={formKeyName}
          type="text"
          value={props.name}
          onChange={(event) => {
            const newName = event.target.value;
            field.handleChange((previous) => {
              if (newName === nameRef.current) {
                return previous;
              }
              if (newName && newName in previous) {
                setKeyError('Key already exists.');
                return previous;
              }
              setKeyError(undefined);
              const previousValue = previous[nameRef.current];
              if (previousValue === undefined) {
                return previous;
              }
              const newRecord = {
                ...previous,
              };
              if (newName) {
                newRecord[newName] = { ...previousValue, name: newName };
              }
              delete newRecord[nameRef.current];
              props.onKeyChange(nameRef.current, newName);
              nameRef.current = newName;
              return newRecord;
            });
          }}
          placeholder={props.keyPlaceholder}
          disabled={props.disabled}
          readOnly={props.readOnly}
          autoComplete="off"
          className="text-xs"
        />
        <FieldErrors errors={keyError ? [keyError] : []} />
      </div>
      <div className="flex grow flex-col gap-2">
        <Label
          htmlFor={props.schemaField.type === SchemaFieldType.BOOLEAN ? undefined : formValueName}
          className={cn('flex items-center gap-1', {
            'h-3': !!props.defaultTooltip,
          })}
        >
          {props.defaultLabel ?? 'Default value'}
          {props.defaultTooltip ? <ToggleTip>{props.defaultTooltip}</ToggleTip> : null}
        </Label>
        <div className="grid grid-cols-[1fr_28px] items-center gap-4">
          {props.schemaField.type === SchemaFieldType.BOOLEAN ? (
            <div className="flex items-center gap-2">
              <Checkbox
                id={formValueName}
                name={formValueName}
                checked={props.schemaField.default}
                onCheckedChange={(checked) =>
                  // @ts-expect-error — Record<...> Updater type narrows to a strict union; runtime is fine.
                  field.handleChange((previous) => {
                    const previousField =
                      previous[props.name] ??
                      ({
                        type: props.schemaField.type,
                        name: '',
                        default: false,
                      } as any);
                    return {
                      ...previous,
                      [props.name]: { ...previousField, default: checked ?? false },
                    };
                  })
                }
                disabled={props.disabled}
                className="text-xs"
              />
              <Label htmlFor={formValueName}>{props.schemaField.default.toString()}</Label>
            </div>
          ) : (
            <Input
              id={formValueName}
              name={formValueName}
              type={props.schemaField.type === SchemaFieldType.NUMBER ? 'number' : 'text'}
              value={props.schemaField.default}
              onChange={(event) =>
                // @ts-expect-error — Record<...> Updater type narrows to a strict union; runtime is fine.
                field.handleChange((previous) => {
                  const previousField =
                    previous[props.name] ??
                    ({
                      type: props.schemaField.type,
                      name: '',
                      default: props.schemaField.type === SchemaFieldType.NUMBER ? 0 : '',
                    } as any);
                  const value =
                    props.schemaField.type === SchemaFieldType.NUMBER
                      ? event.target.valueAsNumber || 0
                      : event.target.value;
                  return {
                    ...previous,
                    [props.name]: { ...previousField, default: value },
                  };
                })
              }
              placeholder={
                props.schemaField.type === SchemaFieldType.NUMBER ? '0' : props.defaultPlaceholder
              }
              disabled={props.disabled}
              readOnly={props.readOnly}
              autoComplete="off"
              className="text-xs"
            />
          )}
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
        </div>
      </div>
    </div>
  );
}
