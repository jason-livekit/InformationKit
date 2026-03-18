import { CloseIcon } from '@/icons/react';
import type { Table } from '@tanstack/react-table';

interface DataTableActiveFiltersProps<TData> {
  table: Table<TData>;
}

export function DataTableActiveFilters<TData>({ table }: DataTableActiveFiltersProps<TData>) {
  'use no memo';

  const { columnFilters } = table.getState();

  const filters = columnFilters.filter(({ id }) => {
    const column = table.getColumn(id);

    if (column?.columnDef.meta?.type) {
      return column.columnDef.meta.type === 'enum';
    } else {
      console.error('Column type not defined in meta for id:', id);
      return false;
    }
  });

  if (!filters.length) {
    return null;
  }

  return (
    <div className="border-separator1 flex items-center gap-2 border-b px-4 py-2">
      {filters.map(({ id, value }) => {
        const column = table.getColumn(id);

        if (value instanceof Array) {
          value = value
            .map((v) => {
              return (
                column?.columnDef.meta?.enums?.find((e) => e.value === String(v))?.displayName || v
              );
            })
            .join(', ');
        }

        return (
          <div
            key={id}
            className="border-separatorAccent bg-bgAccent1 flex items-center gap-1.5 rounded-full border py-1 pr-2 pl-3 text-sm"
          >
            <div>
              <span className="text-fg1">{column?.columnDef.meta?.displayName}</span> is{' '}
              <span className="text-fg1">{String(value)}</span>
            </div>
            <CloseIcon
              className="text-fg1 h-3.5 w-3.5 cursor-pointer"
              onClick={() => {
                column?.setFilterValue(undefined);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
