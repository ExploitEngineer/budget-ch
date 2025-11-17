"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptHubInvitation } from "@/lib/services/hub-invitation";
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

  useEffect((): void => {
    if (!token) {
      setStatus("error");
      return;
    }

    const run = async (): Promise<void> => {
      const res = await acceptHubInvitation(token);

      if (res.success) {
        toast.success("Invitation accepted!");
        setStatus("accepted");

        const interval = setInterval((): void => {
          setCountdown((prev: number): number => {
            if (prev === 1) {
              clearInterval(interval);
              router.push("/me/dashboard");
            }
            return prev - 1;
          });
        }, 1000);
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
              onClick={() => router.push("/me/dashboard")}
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
    <div className="relative min-h-screen w-full bg-black">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
          radial-gradient(ellipse 120% 80% at 70% 20%, rgba(255, 20, 147, 0.15), transparent 50%),
          radial-gradient(ellipse 100% 60% at 30% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
          radial-gradient(ellipse 90% 70% at 50% 0%, rgba(138, 43, 226, 0.18), transparent 65%),
          radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
          #000000
        `,
        }}
      />
      <div className="absolute right-0 left-0 flex h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
