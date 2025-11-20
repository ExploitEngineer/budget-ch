"use client";

import { useEffect, useState, useTransition } from "react";
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
} from "@/lib/services/hub-invitation";
import { Spinner } from "@/components/ui/spinner";
import {
  hubInvitesSchema,
  HubInvitesValues,
} from "@/lib/validations/hub-invites-validations";
import { canAccessFeature } from "@/lib/services/features-permission";

interface MembersInvitationsProps {
  hubId: string;
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

export function MembersInvitations({ hubId }: MembersInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

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
      toast.error("Failed to load invitations & members");
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
          toast.success(result.message || "Invitation sent");
          form.reset();

          const invRes = await getHubInvitations(hubId);
          if (invRes.success && Array.isArray(invRes.data)) {
            setInvitations(invRes.data);
          }
        } else {
          toast.error(result.message || "Failed to send invitation");
        }
      } catch (e) {
        console.error(e);
        toast.error("Error sending invitation");
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

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Members & Invitations</CardTitle>

          <Badge
            variant="outline"
            className="bg-badge-background dark:border-border-blue rounded-full px-3 py-2"
          >
            {totalMembers} Members
          </Badge>
        </CardHeader>

        <Separator className="dark:bg-border-blue" />

        <CardContent className="space-y-6 pt-6">
          {/* INVITE FORM */}
          <div>
            <h3 className="mb-4 font-semibold">Send Invitation</h3>

            {!canSend && (
              <p className="mb-4 text-sm text-red-500">
                {subscriptionPlan === null
                  ? "You are on the free plan."
                  : "You are on the individual plan."}{" "}
                Upgrade to use this feature.
              </p>
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="user@example.com"
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
                        <FormLabel>Role</FormLabel>
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
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
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
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isPending || !canSend}
                    className="btn-gradient cursor-pointer dark:text-white"
                  >
                    {isPending ? (
                      <>
                        <Spinner className="mr-2" /> Sending...
                      </>
                    ) : !canSend ? (
                      "Upgrade to Invite"
                    ) : (
                      "Send Invitation"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
