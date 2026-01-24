"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  sendHubInvitation,
  getHubInvitations,
  getHubMembers,
  cancelHubInvitation,
  removeHubMember,
} from "@/lib/services/hub-invitation";
import { Spinner } from "@/components/ui/spinner";
import {
  hubInvitesSchema,
  HubInvitesValues,
} from "@/lib/validations/hub-invites-validations";
import { canAccessFeature } from "@/lib/services/features-permission";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface MembersInvitationsProps {
  hubId: string;
  userRole: string;
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member";
  accepted: boolean;
  expiresAt: string | Date;
  createdAt: string | Date;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  isOwner: boolean;
  joinedAt: string | Date;
}

const formatDate = (value?: string | Date): string => {
  if (!value) return "-";

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "-";
  }
};

export function MembersInvitations({ hubId, userRole }: MembersInvitationsProps) {
  const t = useTranslations(
    "main-dashboard.settings-page.members-invitations-section",
  );

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<HubInvitesValues>({
    resolver: zodResolver(hubInvitesSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  useEffect((): void => {
    (async (): Promise<void> => {
      const res = await canAccessFeature("collaborative");
      setCanSend(res.canAccess);
      setSubscriptionPlan(res.subscriptionPlan);
    })();
  }, []);

  const memberColumns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => t("members-table.table-headings.name"),
        cell: (info) => info.getValue() || info.row.original.email,
      },
      {
        accessorKey: "email",
        header: () => t("members-table.table-headings.email"),
      },
      {
        accessorKey: "role",
        header: () => t("members-table.table-headings.role"),
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "joinedAt",
        header: () => t("members-table.table-headings.joined"),
        cell: (info) => formatDate(info.row.original.joinedAt),
      },
      ...(userRole === "admin"
        ? [
            {
              id: "actions",
              header: () => t("members-table.table-headings.actions"),
              cell: (info: any) => {
                if (info.row.original.isOwner) return null;
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(info.row.original)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    {t("buttons.remove-member")}
                  </Button>
                );
              },
            } as ColumnDef<Member>,
          ]
        : []),
    ],
    [t, userRole, isPending],
  );

  const handleRemoveMember = async (member: Member): Promise<void> => {
    startTransition(async (): Promise<void> => {
      try {
        const result = await removeHubMember(member.id, hubId);
        if (result.success) {
          toast.success(t("messages.member-removed"));
          const membRes = await getHubMembers(hubId);
          if (membRes.success && Array.isArray(membRes.data)) {
            setMembers(membRes.data as Member[]);
          }
        } else {
          toast.error(result.message || t("messages.remove-error"));
        }
      } catch (e) {
        console.error(e);
        toast.error(t("messages.remove-error"));
      } finally {
        setMemberToRemove(null);
      }
    });
  };

  const handleCancelInvitation = async (invitationId: string): Promise<void> => {
    startTransition(async (): Promise<void> => {
      try {
        const result = await cancelHubInvitation(invitationId, hubId);
        if (result.success) {
          toast.success(t("messages.invitation-cancelled"));
          // Refresh invitations list
          const invRes = await getHubInvitations(hubId);
          if (invRes.success && Array.isArray(invRes.data)) {
            setInvitations(invRes.data);
          }
        } else {
          toast.error(result.message || t("messages.cancel-error"));
        }
      } catch (e) {
        console.error(e);
        toast.error(t("messages.cancel-error"));
      }
    });
  };

  const invitationColumns = useMemo<ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: "email",
        header: () => t("invitations-table.table-headings.email"),
      },
      {
        accessorKey: "role",
        header: () => t("invitations-table.table-headings.role"),
      },
      {
        id: "status",
        header: () => t("invitations-table.table-headings.status"),
        cell: (info) => (
          <Badge
            variant="outline"
            className="rounded-full px-2 text-xs uppercase"
          >
            {info.row.original.accepted
              ? t("invitations-table.statuses.accepted")
              : t("invitations-table.statuses.pending")}
          </Badge>
        ),
      },
      {
        accessorKey: "expiresAt",
        header: () => t("invitations-table.table-headings.expires"),
        cell: (info) => formatDate(info.row.original.expiresAt),
      },
      {
        id: "actions",
        header: () => t("invitations-table.table-headings.actions"),
        cell: (info) => {
          // Only show cancel button for pending (not accepted) invitations
          if (info.row.original.accepted) {
            return null;
          }
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelInvitation(info.row.original.id)}
              disabled={isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {t("buttons.cancel-invitation")}
            </Button>
          );
        },
      },
    ],
    [t, isPending, hubId],
  );

  const membersTable = useReactTable({
    columns: memberColumns,
    data: members,
    getCoreRowModel: getCoreRowModel(),
  });

  const invitationsTable = useReactTable({
    columns: invitationColumns,
    data: invitations,
    getCoreRowModel: getCoreRowModel(),
  });

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);

      const [invRes, membRes] = await Promise.all([
        getHubInvitations(hubId),
        getHubMembers(hubId),
      ]);

      if (invRes.success && Array.isArray(invRes.data)) {
        setInvitations(invRes.data);
      }

      if (membRes.success && Array.isArray(membRes.data)) {
        setMembers(membRes.data as Member[]);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("messages.load-error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect((): void => {
    loadData();
  }, [hubId]);

  const onSubmit = async (values: HubInvitesValues): Promise<void> => {
    startTransition(async (): Promise<void> => {
      try {
        const result = await sendHubInvitation({
          hubId,
          email: values.email,
          role: values.role,
        });

        if (result.success) {
          toast.success(result.message || t("messages.invitation-sent"));
          form.reset();

          const invRes = await getHubInvitations(hubId);
          if (invRes.success && Array.isArray(invRes.data)) {
            setInvitations(invRes.data);
          }
        } else {
          toast.error(result.message || t("messages.send-error"));
        }
      } catch (e) {
        console.error(e);
        toast.error(t("messages.send-unexpected-error"));
      }
    });
  };

  if (loading) {
    return (
      <Card className="bg-blue-background dark:border-border-blue">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  const totalMembers =
    members.length +
    invitations.filter((i: Invitation): boolean => i.accepted === true).length;

  const planMessage =
    subscriptionPlan === null
      ? t("plan-warning.free")
      : t("plan-warning.individual");

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>

          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
          >
            {t("badge", { count: totalMembers })}
          </Badge>
        </CardHeader>

        <Separator className="dark:bg-border-blue" />

        <CardContent className="space-y-8 pt-6">
          {/* INVITE FORM */}
          <div>
            <h3 className="mb-4 font-semibold">{t("button")}</h3>

            {!canSend && (
              <p className="mb-4 text-sm text-red-500">{planMessage}</p>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="flex gap-4">
                  {/* EMAIL FIELD */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.invite-email.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t(
                              "labels.invite-email.placeholder",
                            )}
                            disabled={isPending}
                            className="dark:border-border-blue !bg-dark-blue-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ROLE FIELD */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>{t("labels.role.title")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <SelectTrigger className="dark:border-border-blue !bg-dark-blue-background w-full">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent className="dark:!bg-dark-blue-background bg-white">
                              <SelectItem value="member">
                                {t("labels.role.select-options.member")}
                              </SelectItem>
                              <SelectItem value="admin">
                                {t("labels.role.select-options.admin")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(): void => form.reset()}
                    disabled={isPending}
                  >
                    {t("buttons.cancel")}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isPending || !canSend}
                    className="btn-gradient cursor-pointer dark:text-white"
                  >
                    {isPending ? (
                      <>
                        <Spinner className="mr-2" />
                        {t("buttons.sending")}
                      </>
                    ) : !canSend ? (
                      t("buttons.upgrade")
                    ) : (
                      t("buttons.send")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* TABLES */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {t("invitations-table.title")}
                </p>
                <Badge
                  variant="outline"
                  className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1 text-xs"
                >
                  {t("invitations-table.badge", { count: invitations.length })}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border transition-colors">
                {invitations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    {t("invitations-table.empty")}
                  </div>
                ) : (
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      {invitationsTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                          key={headerGroup.id}
                          className="dark:border-border-blue"
                        >
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="font-bold text-gray-500 uppercase dark:text-gray-400/80"
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
                      {invitationsTable.getRowModel().rows.length ? (
                        invitationsTable.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="dark:border-border-blue"
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
                            colSpan={invitationColumns.length}
                            className="text-center text-sm"
                          >
                            {t("invitations-table.empty")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {t("members-table.title")}
                </p>
                <Badge
                  variant="outline"
                  className="bg-badge-background dark:border-border-blue rounded-full px-3 py-1 text-xs"
                >
                  {t("members-table.badge", { count: members.length })}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border transition-colors">
                {members.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    {t("members-table.empty")}
                  </div>
                ) : (
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      {membersTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                          key={headerGroup.id}
                          className="dark:border-border-blue"
                        >
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="font-bold text-gray-500 uppercase dark:text-gray-400/80"
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
                      {membersTable.getRowModel().rows.length ? (
                        membersTable.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="dark:border-border-blue"
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
                            colSpan={memberColumns.length}
                            className="text-center text-sm"
                          >
                            {t("members-table.empty")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove-dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove-dialog.description", {
                name: memberToRemove?.name || memberToRemove?.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t("remove-dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending
                ? t("remove-dialog.removing")
                : t("remove-dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
