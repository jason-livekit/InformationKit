'use client';

import { useCallback, useMemo } from 'react';
import { FilterIcon } from '@/icons/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column, Table } from '@tanstack/react-table';

export function DataTableEnumFilter<TData>({ table }: { table: Table<TData> }) {
  'use no memo';

  const enumColumnFilterOptions = useMemo(
    () => table.getFlatHeaders().filter((header) => header.column.columnDef.meta?.type === 'enum'),
    [table],
  );

  const onClearAllFilters = useCallback(() => {
    table.setColumnFilters([]);
    table.setPageIndex(0);
  }, [table]);

  const toggleChecked = (column: Column<TData, unknown>, value: string) => {
    const selectedEnums = (column.getFilterValue() as string[]) || [];

    if (column.columnDef.meta?.exclusiveEnum) {
      column.setFilterValue(selectedEnums.includes(value) ? undefined : [value]);
      return;
    }

    if (selectedEnums.includes(value)) {
      selectedEnums.splice(selectedEnums.indexOf(value), 1);
    } else {
      selectedEnums.push(value);
    }

    column.setFilterValue(selectedEnums.length > 0 ? selectedEnums : undefined);
    table.setPageIndex(0);
  };

  if (enumColumnFilterOptions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          leftIcon={<FilterIcon className="size-4" />}
        >
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {enumColumnFilterOptions.map(({ column }) => (
          <DropdownMenuSub key={column.columnDef.meta?.displayName}>
            <DropdownMenuSubTrigger>{column.columnDef.meta?.displayName}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {column.columnDef.meta?.enums?.map(({ displayName, value }, idx) => (
                  <DropdownMenuItem key={idx} onClick={() => toggleChecked(column, value)}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        onClick={(e) => e.preventDefault()}
                        checked={((column.getFilterValue() as string[]) || []).includes(value)}
                        onCheckedChange={() => toggleChecked(column, value)}
                      />
                      <div>{displayName}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={table.getState().columnFilters.length === 0}
          onClick={onClearAllFilters}
        >
          Clear all filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
