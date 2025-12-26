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
  FilterFn,
  Row,
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
import EditTransactionDialog from "@/app/me/transactions/_components/edit-transaction-dialog";
import type { Transaction } from "@/lib/types/dashboard-types";
import { Spinner } from "@/components/ui/spinner";
import { useExportCSV } from "@/hooks/use-export-csv";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAllTransactions, deleteTransactions } from "@/lib/services/transaction";
import { transactionKeys, accountKeys } from "@/lib/query-keys";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { TransactionFiltersFormValues } from "@/lib/validations/transaction-filters-validations";
import { ButtonGroup } from "@/components/ui/button-group";

interface DataTableProps {
  transactions: Transaction[];
  filters: TransactionFiltersFormValues;
  loading?: boolean;
  error?: string | null;
}

// Custom filter function for transactions
const transactionFilterFn: FilterFn<Transaction> = (
  row: Row<Transaction>,
  _columnId: string,
  filterValue: TransactionFiltersFormValues,
) => {
  const tx = row.original;

  // Date filtering
  if (tx.date && tx.date !== "—") {
    const [day, month, year] = tx.date.split("/").map(Number);
    const txDate = new Date(year, month - 1, day);
    txDate.setHours(0, 0, 0, 0);

    if (filterValue.dateFrom) {
      const fromDate = new Date(filterValue.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (txDate < fromDate) return false;
    }

    if (filterValue.dateTo) {
      const toDate = new Date(filterValue.dateTo);
      toDate.setHours(0, 0, 0, 0);
      if (txDate > toDate) return false;
    }
  }

  // Category filtering
  if (filterValue.category && filterValue.category !== "") {
    if (tx.category !== filterValue.category) return false;
  }

  // Amount filtering
  if (filterValue.amountMin && filterValue.amountMin > 0) {
    if (Math.abs(tx.amount) < filterValue.amountMin) return false;
  }

  if (filterValue.amountMax && filterValue.amountMax > 0) {
    if (Math.abs(tx.amount) > filterValue.amountMax) return false;
  }

  // Text search filtering
  if (filterValue.text && filterValue.text.trim() !== "") {
    const searchText = filterValue.text.toLowerCase();
    const matchesRecipient = tx.recipient?.toLowerCase().includes(searchText);
    const matchesNote = tx.note?.toLowerCase().includes(searchText);
    const matchesCategory = tx.category?.toLowerCase().includes(searchText);
    if (!matchesRecipient && !matchesNote && !matchesCategory) return false;
  }

  // With Recipient filter
  if (filterValue.withReceipt) {
    const recipient = tx.recipient?.trim();
    if (!recipient || recipient === "—") return false;
  }

  // Transfers only filter
  if (filterValue.transfersOnly) {
    if (tx.type !== "transfer") return false;
  }

  // Recurring filter (only show recurring transactions when checked)
  if (filterValue.isRecurring) {
    console.log('🔍 RECURRING FILTER CHECK:', {
      isRecurringFilterActive: filterValue.isRecurring,
      txId: tx.id,
      txRecipient: tx.recipient,
      txRecurringTemplateId: tx.recurringTemplateId,
      txIsRecurring: tx.isRecurring,
      willShow: !!tx.recurringTemplateId
    });
    if (!tx.recurringTemplateId) return false;
  }

  return true;
};

export function DataTable({
  transactions,
  filters,
  loading,
  error,
}: DataTableProps) {
  const t = useTranslations("main-dashboard.transactions-page");
  const commonT = useTranslations("common");
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
  const [globalFilter, setGlobalFilter] =
    React.useState<TransactionFiltersFormValues>(filters);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [confirmDeleteSelectedDialogOpen, setConfirmDeleteSelectedDialogOpen] =
    React.useState(false);

  // Update global filter when filters prop changes
  React.useEffect(() => {
    setGlobalFilter(filters);
  }, [filters]);

  const deleteAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      const result = await deleteAllTransactions();
      if (!result.success) {
        throw new Error(result.message || "Failed to delete all transactions");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      setConfirmDialogOpen(false);
      setRowSelection({});
      toast.success(t("messages.all-deleted"));
    },
    onError: (error: Error) => {
      setConfirmDialogOpen(false);
      toast.error(
        error.message ||
        t("messages.error.delete-all"),
      );
    },
  });

  const deleteSelectedTransactionsMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const result = await deleteTransactions(transactionIds);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete selected transactions");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.list(hubId) });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(hubId),
      });
      queryClient.invalidateQueries({ queryKey: accountKeys.list(hubId) });
      setConfirmDeleteSelectedDialogOpen(false);
      setRowSelection({});
      toast.success(t("data-table.delete-selected.success"));
    },
    onError: (error: Error) => {
      setConfirmDeleteSelectedDialogOpen(false);
      toast.error(
        error.message ||
        t("data-table.delete-selected.error"),
      );
    },
  });

  const handleConfirmDeleteAll = () => {
    if (deleteAllTransactionsMutation.isPending) {
      return;
    }

    deleteAllTransactionsMutation.mutate();
  };

  const handleConfirmDeleteSelected = () => {
    if (deleteSelectedTransactionsMutation.isPending) {
      return;
    }

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const transactionIds = selectedRows.map((row) => row.original.id);

    if (transactionIds.length === 0) {
      return;
    }

    deleteSelectedTransactionsMutation.mutate(transactionIds);
  };

  const title = t("transaction-edit-dialog.title-1");

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
    {
      accessorKey: "date",
      header: t("data-table.headings.date"),
    },
    {
      accessorKey: "type",
      header: t("data-table.headings.type"),
    },
    {
      accessorKey: "source",
      header: t("data-table.headings.recipient"),
      cell: ({ row }) => row.original.recipient || "—",
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
        const type = row.original.type;
        const formatted = `${commonT("currency")} ${amount.toLocaleString()}`;

        // Color based on transaction type:
        // expense & transfer = red (deduct)
        // income = green (add)
        // Using cleaner, less harsh color variants
        const colorClass = type === "income" ? "text-[#48A8A0]" : "text-[#D07270]";

        return (
          <span className={`font-semibold ${colorClass}`}>
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
          <EditTransactionDialog
            variant="outline"
            text={title}
            transaction={transaction}
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    filterFns: {
      transactionFilter: transactionFilterFn,
    },
    globalFilterFn: transactionFilterFn,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Calculate if some but not all rows are selected
  const selectedRowCount = React.useMemo(() => {
    return table.getFilteredSelectedRowModel().rows.length;
  }, [table, rowSelection]);

  const totalRowCount = React.useMemo(() => {
    return table.getFilteredRowModel().rows.length;
  }, [table]);

  const showDeleteSelectedButton = React.useMemo(() => {
    return selectedRowCount > 0 && selectedRowCount < totalRowCount;
  }, [selectedRowCount, totalRowCount]);

  // Calculate total balance from filtered rows
  const totalBalance = React.useMemo(() => {
    return table
      .getFilteredRowModel()
      .rows.reduce((acc, row) => acc + row.original.amount, 0);
  }, [table]);

  if (loading) {
    return (
      <Card className="bg-blue-background dark:border-border-blue flex items-center justify-center p-10">
        <Spinner />
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
            {showDeleteSelectedButton && (
              <Button
                size="sm"
                variant="destructive"
                className="cursor-pointer"
                disabled={deleteSelectedTransactionsMutation.isPending}
                onClick={() => setConfirmDeleteSelectedDialogOpen(true)}
              >
                {t("data-table.header.buttons.deleteSelected")}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="cursor-pointer"
              disabled={deleteAllTransactionsMutation.isPending}
              onClick={() => setConfirmDialogOpen(true)}
            >
              {t("data-table.header.buttons.deleteAll")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportTransactions({
                  transactions: table
                    .getFilteredRowModel()
                    .rows.map((row) => row.original),
                })
              }
              className="!bg-dark-blue-background dark:border-border-blue cursor-pointer"
            >
              {t("data-table.header.buttons.export")} CSV
            </Button>
            <Dialog
              open={confirmDialogOpen}
              onOpenChange={setConfirmDialogOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {t("data-table.confirmation.title")}
                  </DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-sm">
                  {t("data-table.confirmation.description")}
                </DialogDescription>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDialogOpen(false)}
                  >
                    {t("data-table.confirmation.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDeleteAll}
                    disabled={deleteAllTransactionsMutation.isPending}
                  >
                    {deleteAllTransactionsMutation.isPending ? (
                      <Spinner />
                    ) : (
                      t("data-table.confirmation.confirm")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog
              open={confirmDeleteSelectedDialogOpen}
              onOpenChange={setConfirmDeleteSelectedDialogOpen}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {t("data-table.delete-selected.confirmation.title")}
                  </DialogTitle>
                </DialogHeader>

                <DialogDescription className="text-sm">
                  {t("data-table.delete-selected.confirmation.description", {
                    count: selectedRowCount,
                  })}
                </DialogDescription>

                <DialogFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteSelectedDialogOpen(false)}
                  >
                    {t("data-table.delete-selected.confirmation.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDeleteSelected}
                    disabled={deleteSelectedTransactionsMutation.isPending}
                  >
                    {deleteSelectedTransactionsMutation.isPending ? (
                      <Spinner />
                    ) : (
                      t("data-table.delete-selected.confirmation.confirm")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* <div className="flex flex-wrap items-center gap-2">
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
          </div> */}
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
                    className="dark:border-border-blue capitalize"
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
                    {t("data-table.no-results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="text-muted-foreground text-sm">
            {t("data-table.rows-selected", {
              selected: table.getFilteredSelectedRowModel().rows.length,
              total: table.getFilteredRowModel().rows.length,
            })}
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
