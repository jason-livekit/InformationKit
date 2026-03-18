import { ArrowDownIcon, ArrowUpIcon, ChevronGrabberVerticalIcon } from '@/icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column, HeaderContext, Table } from '@tanstack/react-table';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  column: Column<TData, TValue>;
  title: string | undefined;
}

// Helper function to use for react-table column configuration
export function DataTableColumnHeaderFn<TData>({ table, column }: HeaderContext<TData, unknown>) {
  return (
    <DataTableColumnHeader
      table={table}
      column={column}
      title={column.columnDef.meta?.displayName}
    />
  );
}

export function DataTableColumnHeader<TData, TValue>({
  table,
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  'use no memo';

  if (title === undefined) {
    title = column.id;
  }

  if (!column.getCanSort()) {
    return (
      <div
        className={cn(className, 'text-fg3 text-xxs font-mono font-bold tracking-wider uppercase')}
      >
        {title}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'text-fg3 data-[state=open]:bg-bg3 text-xxs -ml-3 h-7 font-mono font-semibold tracking-wider uppercase',
              column.getIsSorted() && 'text-fg1',
            )}
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDownIcon className="stroke-fg3 ml-1 size-3 stroke-1" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUpIcon className="stroke-fg3 ml-1 size-3 stroke-1" />
            ) : (
              <ChevronGrabberVerticalIcon className="ml-1 h-full w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              table.setSorting([{ id: column.id, desc: false }]);
            }}
          >
            <ArrowUpIcon className="text-fg1 mr-2 h-3.5 w-3.5" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              table.setSorting([{ id: column.id, desc: true }]);
            }}
          >
            <ArrowDownIcon className="text-fg1 mr-2 h-3.5 w-3.5" />
            Descending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
