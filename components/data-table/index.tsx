'use client';

import { Fragment, useState, type Dispatch, type SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  SortingState,
  TableOptions,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { DataTableActiveFilters } from './ActiveFilters';
import { DataTableEnumFilter } from './EnumFilterControl';
import { DataTablePagination } from './PaginationControl';
import { DataTableStringFilter } from './StringFilterControl';

interface DataTablePropsBase<TData, TValue> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];
  onRowClick?: (row: Row<TData>) => void;
  isFetching?: boolean;
  error?: Error | null;
  padLastPage?: boolean; // adds empty rows to pad the last page of results
  loadingContent?: React.ReactNode;
  emptyContent?: React.ReactNode;
  options?: CustomTableOptions<TData>;
  pageSize?: number; // only used for client-side pagination
}

type ServerPaginationProps = {
  totalCount: number;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
};

type ClientPaginationProps = {
  pagination?: never;
  setPagination?: never;
  totalCount?: never;
};

type NoPaginationProps = {
  pagination: false;
  setPagination?: never;
  totalCount?: never;
};

type SortingProps = {
  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;
};

type NoSortingProps = {
  sorting?: never;
  setSorting?: never;
};

type ColumnFiltersProps = {
  columnFilters: ColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
};

type NoColumnFiltersProps = {
  columnFilters?: never;
  setColumnFilters?: never;
};

export type CustomTableOptions<TData> = Omit<Partial<TableOptions<TData>>, 'data' | 'columns'> & {
  rowDetailRenderer?: (row: Row<TData>) => React.ReactNode; // allows for rendering an expanded row that does not conform to the column defs, as in a detail panel
};

export type DataTableProps<TData, TValue> = DataTablePropsBase<TData, TValue> &
  (ClientPaginationProps | ServerPaginationProps | NoPaginationProps) &
  (SortingProps | NoSortingProps) &
  (ColumnFiltersProps | NoColumnFiltersProps);

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  'use no memo';

  const padLastPage = props.padLastPage !== undefined ? props.padLastPage : true;
  const loadingContent = props.loadingContent ?? 'Loading...';
  const emptyContent = props.emptyContent ?? 'No results.';

  // NOTE: This state is unused for tables with server-side pagination, and in cases
  //       where client-side pagination is opted out of with `pagination={false}`.
  // TODO: Maybe allow for customization here.
  const [clientSidePagination, setClientSidePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: props.pageSize ?? 10,
  });

  const tableOptions: TableOptions<TData> = {
    data: props.data ?? [],
    columns: props.columns,
    getCoreRowModel: getCoreRowModel(),
    ...props.options,
  };

  if (props.totalCount !== undefined) {
    tableOptions.rowCount = props.totalCount;
  }

  if (props.pagination && typeof props.setPagination === 'function') {
    // https://tanstack.com/table/v8/docs/guide/pagination#manual-server-side-pagination
    tableOptions.manualPagination = true;
    tableOptions.onPaginationChange = props.setPagination;
    if (tableOptions.state) {
      tableOptions.state.pagination = props.pagination;
    } else {
      tableOptions.state = { pagination: props.pagination };
    }
  } else if (props.pagination === false) {
    // unpaginated
    tableOptions.pageCount = 1;
  } else {
    // https://tanstack.com/table/v8/docs/guide/pagination#client-side-pagination
    tableOptions.getPaginationRowModel = getPaginationRowModel();
    if (tableOptions.state) {
      tableOptions.state.pagination = clientSidePagination;
    } else {
      tableOptions.state = { pagination: clientSidePagination };
    }
    tableOptions.onPaginationChange = setClientSidePagination;
  }

  if (props.sorting && typeof props.setSorting === 'function') {
    // https://tanstack.com/table/latest/docs/guide/sorting#manual-server-side-sorting
    tableOptions.manualSorting = true;
    tableOptions.onSortingChange = props.setSorting;
    if (tableOptions.state) {
      tableOptions.state.sorting = props.sorting;
    } else {
      tableOptions.state = { sorting: props.sorting };
    }
  } else {
    // https://tanstack.com/table/latest/docs/guide/sorting#client-side-sorting
    tableOptions.getSortedRowModel = getSortedRowModel();
  }

  if (props.columnFilters && typeof props.setColumnFilters === 'function') {
    // https://tanstack.com/table/latest/docs/guide/column-filtering#manual-server-side-filtering
    tableOptions.manualFiltering = true;
    tableOptions.onColumnFiltersChange = props.setColumnFilters;
    if (tableOptions.state) {
      tableOptions.state.columnFilters = props.columnFilters;
    } else {
      tableOptions.state = { columnFilters: props.columnFilters };
    }
  } else {
    // https://tanstack.com/table/latest/docs/guide/column-filtering#client-side-filtering
    tableOptions.getFilteredRowModel = getFilteredRowModel();
  }

  const table = useReactTable(tableOptions);

  const hasFooter = table
    .getFooterGroups()
    .some((group) => group.headers.some((header) => !!header.column.columnDef.footer));
  return (
    <div className="relative space-y-4">
      <div className="border-separator1 rounded border">
        {(props.title || props.actions) && (
          <div className="border-separator1 border-b px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-fg1 text-base font-semibold">{props.title}</h1>
                {props.isFetching === true && (
                  <Spinner className="text-fgAccent1 w-4" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {props.actions}
                <DataTableEnumFilter table={table} />
                <DataTableStringFilter table={table} />
              </div>
            </div>
          </div>
        )}
        {props.columnFilters && props.columnFilters.length > 0 && (
          <DataTableActiveFilters table={table} />
        )}
        <ScrollArea dir="ltr">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="h-7">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        data-col-id={header.id}
                        className="whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="text-fg1 text-xs">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isExpanded = row.getIsExpanded();
                  const isDetailVisible = isExpanded && !!props.options?.rowDetailRenderer;

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn('group/row hover:bg-bg2 h-9', {
                          'cursor-pointer': !!props.onRowClick,
                          'border-none': isDetailVisible,
                        })}
                        onClick={() => props.onRowClick?.(row)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.columnDef.meta?.className}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {isDetailVisible && (
                        <TableRow>
                          <TableCell colSpan={row.getAllCells().length}>
                            {props.options?.rowDetailRenderer?.(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={props.columns.length} className="h-24 text-center">
                    {props.isFetching ? loadingContent : emptyContent}
                  </TableCell>
                </TableRow>
              )}
              {padLastPage &&
                table.getPageCount() > 1 &&
                table.getState().pagination.pageIndex !== 0 &&
                table.getState().pagination.pageSize !== undefined &&
                table.getRowModel().rows?.length < table.getState().pagination.pageSize && (
                  <GapFillerRows
                    count={table.getState().pagination.pageSize - table.getRowModel().rows.length}
                  />
                )}
            </TableBody>
            {hasFooter && (
              <TableFooter>
                {table.getFooterGroups().map((footerGroup) => (
                  <TableRow key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.footer, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableFooter>
            )}
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      {table.getPageCount() > 1 && <DataTablePagination table={table} />}
      {!!props.error && <div className="text-sm text-red-300">{props.error.message}</div>}
    </div>
  );
}

function GapFillerRows(props: { count: number }) {
  return (
    <>
      {Array.from({ length: props.count }).map((_, idx) => (
        <TableRow key={idx} className="border-separator1/50 h-9">
          <TableCell colSpan={100} className="" />
        </TableRow>
      ))}
    </>
  );
}
