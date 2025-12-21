"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  warningThreshold = 80,
  markerColor = "standard",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  warningThreshold?: number;
  markerColor?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-[9px] w-full overflow-hidden rounded-full bg-[#F2F6FF] dark:bg-[#0F1523]",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          // If markerColor is explicitly set (not "standard"), use it
          markerColor === "green"
            ? "bg-green-500"
            : markerColor === "orange"
              ? "bg-orange-500"
              : markerColor === "red"
                ? "bg-red-500"
                // Otherwise, use default budget-style logic
                : value && value >= 100
                  ? "bg-red-600"
                  : value && value >= warningThreshold
                    ? "bg-[#F59E0B]"
                    : "progress-gradient",
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
