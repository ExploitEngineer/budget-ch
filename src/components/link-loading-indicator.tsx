"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LinkLoadingIndicator({
  className,
  size,
  children,
}: {
  className?: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const { pending } = useLinkStatus();

  return pending ? (
    <LoaderCircleIcon className={cn("inline animate-spin", className)} size={size} />
  ) : (
    children ?? null
  );
}