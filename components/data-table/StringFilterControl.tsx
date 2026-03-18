'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRightIcon, CloseIcon, SearchIcon } from '@/icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Table } from '@tanstack/react-table';
export function SearchInput({
  value: initialValue,
  onValueChange,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
  debounce?: number;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onValueChange(value);
    }, 400);
    return () => clearTimeout(timer);
  }, [value, onValueChange]);

  return (
    <div className="relative">
      <Input
        {...props}
        className="h-7 w-58 rounded-l-none pr-8"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      {value && (
        <CloseIcon
          className="absolute top-[6px] right-1.5 size-4 cursor-pointer"
          onClick={() => {
            setValue('');
          }}
        />
      )}
    </div>
  );
}

export function DataTableStringFilter<TData>({ table }: { table: Table<TData> }) {
  'use no memo';

  const { columnFilters } = table.getState();

  const activeStringColumnFilter = columnFilters.find((filter) => {
    const column = table.getColumn(filter.id);
    return column?.columnDef.meta?.type === 'string';
  });

  const stringColumnFilterOptions = useMemo(
    () =>
      table
        .getFlatHeaders()
        .filter(
          (header) =>
            header.column.getCanFilter() && header.column.columnDef.meta?.type === 'string',
        ),
    [table],
  );

  const [showSearch, setShowSearch] = useState(Boolean(activeStringColumnFilter?.id));
  const [query, setQuery] = useState(String(activeStringColumnFilter?.value ?? ''));
  const [selectedStringColumnIdx, setSelectedStringColumnIdx] = useState(() => {
    if (activeStringColumnFilter) {
      return stringColumnFilterOptions.findIndex(
        ({ column }) => column.id === activeStringColumnFilter.id,
      );
    }
    return 0;
  });

  const searchParams = useSearchParams()!;

  useEffect(() => {
    if (!activeStringColumnFilter) {
      setQuery('');
    }
  }, [activeStringColumnFilter, setQuery]);

  useEffect(() => {
    const stringColumnFilterIds = stringColumnFilterOptions.map((header) => {
      return header.column.id!;
    });

    if (stringColumnFilterIds.length > 0) {
      const searchParam = searchParams.get(stringColumnFilterIds[0]!);
      if (searchParam) {
        setShowSearch(true);
        setQuery(searchParam);
      }
    }
  }, [searchParams, stringColumnFilterOptions]);

  useEffect(() => {
    // Clear previous column filter
    const prevColumn = stringColumnFilterOptions.find(({ column }) =>
      column.getFilterValue(),
    )?.column;
    if (prevColumn) {
      prevColumn.setFilterValue(undefined);
    }

    // Set new column filter
    const column = stringColumnFilterOptions[selectedStringColumnIdx]?.column;
    if (showSearch && column) {
      column.setFilterValue(query);
    }
  }, [showSearch, query, selectedStringColumnIdx, stringColumnFilterOptions]);

  const onValueChange = useCallback((value: string) => {
    setQuery(String(value));
  }, []);

  if (stringColumnFilterOptions.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        className="p-0"
        variant="outline"
        size="icon"
        onClick={() => {
          setShowSearch(!showSearch);
        }}
        leftIcon={
          showSearch ? <ChevronRightIcon className="size-3" /> : <SearchIcon className="size-4" />
        }
      />
      {showSearch && (
        <div className="inline-flex">
          <Select
            value={String(selectedStringColumnIdx)}
            onValueChange={(value) => {
              setSelectedStringColumnIdx(Number(value));
            }}
          >
            <SelectTrigger className="text-fg1 h-7 min-w-fit rounded-r-none border-r-0">
              <SelectValue placeholder={table.getState().pagination?.pageSize} />
            </SelectTrigger>
            <SelectContent side="bottom">
              {stringColumnFilterOptions.map(({ column }, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {column.columnDef.meta?.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchInput
            spellCheck={false}
            type="text"
            placeholder="Search..."
            value={query}
            onValueChange={onValueChange}
          />
        </div>
      )}
    </div>
  );
}
