"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EmailVerified() {
  const params = useSearchParams();

  const error = params.get("error");
  const isSuccess = !error;

  return (
    <div className="bg-blue-background/30 dark:bg-dark-blue-background flex h-screen w-full items-center justify-center px-4">
      <Card className="dark:bg-blue-background dark:border-border-blue w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          {isSuccess ? (
            <>
              <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />

              <h1 className="mb-2 text-2xl font-bold">
                Email Verified Successfully!
              </h1>

              <p className="text-muted-foreground mb-6 text-sm">
                Your email has been verified. You can now access your dashboard
                and start using all features.
              </p>

              <Link href="/signin" className="w-full">
                <Button className="btn-gradient w-full cursor-pointer rounded-xl py-5 font-semibold">
                  Go to SignIn
                </Button>
              </Link>
            </>
          ) : (
            <>
              <XCircle className="mb-4 h-16 w-16 text-red-500" />

              <h1 className="mb-2 text-2xl font-bold">Verification Failed</h1>

              <p className="text-muted-foreground mb-6 text-sm">
                {error
                  ? "The verification link is invalid or expired."
                  : "Something went wrong while verifying your email."}
              </p>

              <Link href="/signin" className="w-full">
                <Button className="btn-gradient w-full cursor-pointer rounded-xl py-5 font-semibold">
                  Try Signing In Again
                </Button>
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
