import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    type?: 'string' | 'enum';
    displayName?: string;
    className?: string;
    exclusiveEnum?: boolean;
    enums?: Array<{ displayName: string; value: string }>;
  }
}
