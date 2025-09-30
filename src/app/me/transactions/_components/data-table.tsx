"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import type { Transaction } from "./data";

interface DataTableProps {
  transactions: Transaction[];
}

export function DataTable({ transactions }: DataTableProps) {
  const t = useTranslations("main-dashboard.transactions-page");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: "date", header: t("data-table.headings.date") },
    { accessorKey: "recipient", header: t("data-table.headings.recipient") },
    { accessorKey: "account", header: t("data-table.headings.account") },
    { accessorKey: "category", header: t("data-table.headings.category") },
    { accessorKey: "note", header: t("data-table.headings.note") },
    {
      accessorKey: "amount",
      header: t("data-table.headings.amount"),
      cell: ({ row }) => {
        const amount = row.original.amount;
        const formatted = new Intl.NumberFormat("de-CH", {
          style: "currency",
          currency: "CHF",
        }).format(amount);

        return (
          <span className={amount < 0 ? "text-red-600" : "text-green-600"}>
            {formatted}
          </span>
        );
      },
    },
    {
      id: "action",
      header: t("data-table.headings.action"),
      cell: () => (
        <Button className="cursor-pointer" size="sm" variant="outline">
          {t("data-table.action")}
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer rounded-full px-3 py-2"
              asChild
            >
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                  }
                  aria-label="Select all"
                />
                <span>{t("data-table.header.checkbox")}</span>
              </label>
            </Badge>
            <Button className="cursor-pointer">
              {t("data-table.header.buttons.delete")}
            </Button>
            <Button className="cursor-pointer">
              {t("data-table.header.buttons.category")}
            </Button>
            <Button className="cursor-pointer">
              {t("data-table.header.buttons.export")} CSV
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-2">
              {t("data-table.header.badge")}{" "}
              <span className="font-bold">CHF 4’443.90</span>
            </Badge>
            <Button className="cursor-pointer">
              {t("data-table.header.buttons.update")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px] overflow-x-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="overflow-x-auto">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("data-table.pagination.previous", { default: "Previous" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("data-table.pagination.next", { default: "Next" })}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
}
