"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-[8px] w-full overflow-hidden rounded-full bg-[oklch(0.25_0_0_/_0.2)]",
        className,
      )}
      {...props}
    >
      <svg width="0" height="0">
        <defs>
          <linearGradient
            id="progress-gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--acc)" />
          </linearGradient>
        </defs>
      </svg>

      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: "url(#progress-gradient)",
          backgroundImage: "linear-gradient(180deg, var(--brand), var(--acc))",
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
