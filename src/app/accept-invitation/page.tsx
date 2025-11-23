"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptHubInvitation } from "@/lib/services/hub-invitation";
import { switchHub } from "@/lib/services/hub-switch";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type StatusType = "pending" | "accepted" | "error";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [status, setStatus] = useState<StatusType>("pending");
  const [countdown, setCountdown] = useState<number>(3);
  const [acceptedHubId, setAcceptedHubId] = useState<string | null>(null);

  useEffect((): void => {
    if (!token) {
      setStatus("error");
      return;
    }

    const run = async (): Promise<void> => {
      const res = await acceptHubInvitation(token);

      if (res.success && res.data?.hubId) {
        toast.success("Invitation accepted!");
        setStatus("accepted");
        setAcceptedHubId(res.data.hubId);

        // Set cookie via server action, then navigate
        try {
          await switchHub(res.data.hubId);

          // Navigate to dashboard with hub query parameter
          const dashboardUrl = `/me/dashboard?hub=${res.data.hubId}`;

          const interval = setInterval((): void => {
            setCountdown((prev: number): number => {
              if (prev === 1) {
                clearInterval(interval);
                router.push(dashboardUrl);
              }
              return prev - 1;
            });
          }, 1000);
        } catch (err) {
          console.error("Failed to set hub cookie:", err);
          toast.error("Invitation accepted but failed to set active hub");
          setStatus("error");
        }
      } else {
        toast.error(res.message);
        setStatus("error");
      }
    };

    run();
  }, [token, router]);

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-10 w-10" />
            <p className="text-gray-500">Processing your invitation...</p>
          </div>
        );

      case "accepted":
        return (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold text-green-600">
              Invitation Accepted!
            </h2>
            <p className="text-gray-600">
              Redirecting to your dashboard in {countdown}{" "}
              {countdown === 1 ? "second" : "seconds"}...
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to dashboard with hub query parameter
                if (acceptedHubId) {
                  router.push(`/me/dashboard?hub=${acceptedHubId}`);
                } else {
                  router.push("/me/dashboard");
                }
              }}
              className="mt-2"
            >
              Go Now
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold text-red-600">
              Invalid or Expired Invitation
            </h2>
            <p className="text-gray-600">
              The invitation link is not valid or has already expired.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-blue-background/30 dark:bg-dark-blue-background flex h-screen w-full items-center justify-center px-4">
      <div className="flex h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
