"use client";

import * as React from "react";
import Image from "next/image";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();
  const { open } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props} className={cn(open ? "p-2" : "p-0")}>
      <SidebarHeader
        className={cn(
          "flex items-center justify-start transition-all duration-300",
          open ? "mb-3" : "mb-0",
        )}
      >
        <div className="relative m-0 flex h-auto w-full items-center justify-start p-0">
          {open ? (
            <div className="relative me-8 h-[50px] w-full">
              <Image
                src={
                  resolvedTheme === "dark"
                    ? "/assets/images/dark-logo.png"
                    : "/assets/images/logo.png"
                }
                alt="company logo"
                fill
                className="m-0 object-cover p-0"
                priority
              />
            </div>
          ) : (
            <div className="relative h-[30px] w-[30px]">
              <Image
                src="/assets/images/small-logo.png"
                alt="company small logo"
                fill
                className="m-0 object-cover p-0"
                priority
              />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
