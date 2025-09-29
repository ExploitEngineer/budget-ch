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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  return (
    <Sidebar collapsible="icon" {...props} className={cn(open ? "p-2" : "p-0")}>
      <SidebarHeader className={cn(open ? "mb-3" : "mb-0")}>
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            open ? "opacity-100" : "opacity-90",
          )}
        >
          <Image
            src="/assets/images/bh-logo.png"
            width={50}
            height={50}
            alt="company logo"
            className="shrink-0"
          />
          <div
            className={cn(
              "flex items-center font-semibold transition-opacity duration-300 sm:text-lg",
              open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
            )}
          >
            <span>budgethub</span>
            <span className="text-blue-600">.ch</span>
          </div>
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
