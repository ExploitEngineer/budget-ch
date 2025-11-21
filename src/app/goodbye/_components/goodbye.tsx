"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Goodbye() {
  return (
    <div className="bg-blue-background/30 dark:bg-dark-blue-background flex h-screen w-full items-center justify-center px-4">
      <Card className="dark:bg-blue-background dark:border-border-blue w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <LogOut className="mb-4 h-16 w-16 text-orange-500" />

          <h1 className="mb-2 text-2xl font-bold">
            Account Deleted Successfully
          </h1>

          <p className="text-muted-foreground mb-6 text-sm">
            Your account has been deleted. We're sorry to see you go! You can
            always come back and create a new account anytime.
          </p>

          <Link href="/" className="w-full">
            <Button className="btn-gradient w-full cursor-pointer rounded-xl py-5 font-semibold">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
