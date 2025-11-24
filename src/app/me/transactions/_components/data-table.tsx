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
import TransactionEditDialog from "./transactions-edit-dialog";
import type { Transaction } from "@/lib/types/dashboard-types";
import { Spinner } from "@/components/ui/spinner";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAllTransactionsAndCategories } from "@/lib/services/transaction";
import { transactionKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface DataTableProps {
  transactions: Omit<Transaction, "type">[];
  loading?: boolean;
  error?: string | null;
}

export function DataTable({ transactions, loading, error }: DataTableProps) {
  const t = useTranslations("main-dashboard.transactions-page");
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");

  const { exportTransactions } = useExportCSV();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const deleteAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteAllTransactionsAndCategories();
      if (!result.success) {
        throw new Error(result.message || "Failed to delete all transactions and categories");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent(hubId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      toast.success("All transactions and related categories deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong while deleting all transactions and categories.");
    },
  });

  const title = t("transaction-edit-dialog.title-1");

  const columns: ColumnDef<Omit<Transaction, "type">>[] = [
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
    {
      accessorKey: "date",
      header: t("data-table.headings.date"),
    },
    {
      accessorKey: "source",
      header: t("data-table.headings.recipient"),
      cell: ({ row }) => row.original.recipient || "—",
    },
    {
      accessorKey: "accountType",
      header: t("data-table.headings.account"),
      cell: ({ row }) => {
        const account = row.original.accountType || "—";
        return <span className="capitalize">{account}</span>;
      },
    },
    {
      accessorKey: "category",
      header: t("data-table.headings.category"),
      cell: ({ row }) => {
        const category = row.original.category || "—";
        return <span className="capitalize">{category}</span>;
      },
    },
    {
      accessorKey: "note",
      header: t("data-table.headings.note"),
      cell: ({ row }) => row.original.note || "—",
    },
    {
      accessorKey: "amount",
      header: t("data-table.headings.amount"),
      cell: ({ row }) => {
        const amount = row.original.amount ?? 0;
        const formatted = new Intl.NumberFormat("de-CH", {
          style: "currency",
          currency: "CHF",
        }).format(amount);
        return (
          <span
            className={`font-semibold ${
              amount < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {formatted}
          </span>
        );
      },
    },
    {
      id: "action",
      header: t("data-table.headings.action"),
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <TransactionEditDialog
            variant="outline"
            text={title}
            transaction={{
              id: transaction.id || "",
              date: transaction.date || "-",
              recipient: transaction.recipient || "-",
              accountType: transaction.accountType || "cash",
              category: transaction.category || "-",
              note: transaction.note || "-",
              amount: transaction.amount || 0,
            }}
          />
        );
      },
    },
  ];

  const totalBalance = React.useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

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

  if (loading) {
    return (
      <Card className="bg-blue-background dark:border-border-blue col-span-full p-10 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-blue-background dark:border-border-blue col-span-full p-10 text-center">
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="bg-blue-background dark:border-border-blue col-span-full p-10 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {t("no-transactions")}
        </p>
      </Card>
    );
  }

  return (
    <section className="grid auto-rows-min grid-cols-6">
      <Card className="bg-blue-background dark:border-border-blue col-span-full">
        {/* Header */}
        <CardHeader className="flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue cursor-pointer rounded-full px-3 py-2"
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
            <Button
              variant="outline"
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
              onClick={() => deleteAllTransactionsMutation.mutate()}
              disabled={deleteAllTransactionsMutation.isPending}
            >
              {deleteAllTransactionsMutation.isPending ? (
                <Spinner />
              ) : (
                t("data-table.header.buttons.delete")
              )}
            </Button>
            <Button
              variant="outline"
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.header.buttons.category")}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportTransactions({ transactions })}
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.header.buttons.export")} CSV
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
            >
              {t("data-table.header.badge")}{" "}
              <span className="font-bold">
                {new Intl.NumberFormat("de-CH", {
                  style: "currency",
                  currency: "CHF",
                }).format(totalBalance)}
              </span>
            </Badge>
          </div>
        </CardHeader>

        {/* Table */}
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px] overflow-x-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="dark:border-border-blue"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-bold text-gray-500 dark:text-gray-400/80"
                    >
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
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="dark:border-border-blue"
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

        {/* Footer */}
        <CardFooter className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="dark:border-border-blue !bg-dark-blue-background/80"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("data-table.pagination.previous", { default: "Previous" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="dark:border-border-blue !bg-dark-blue-background"
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
