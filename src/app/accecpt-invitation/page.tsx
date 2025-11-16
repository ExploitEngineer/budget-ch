"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptHubInvitation } from "@/lib/services/hub-invitation";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const run = async () => {
      const res = await acceptHubInvitation(token);

      if (res.success) {
        toast.success("Invitation accepted!");
        setStatus("accepted");

        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        toast.error(res.message);
        setStatus("error");
      }
    };

    run();
  }, [token]);

  if (status === "pending")
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );

  if (status === "error")
    return (
      <div className="flex h-[70vh] items-center justify-center text-red-500">
        Invalid or expired invitation.
      </div>
    );

  return (
    <div className="flex h-[70vh] items-center justify-center">
      Invitation accepted! Redirecting...
    </div>
  );
}
