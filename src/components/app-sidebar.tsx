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
      {/*
      <SidebarHeader
        className={cn(
          "flex items-center justify-start transition-all duration-300",
          open ? "mb-3" : "mb-0",
        )}
      >
        <div className="flex items-center justify-start">
          {open ? (
            <Image
              src="/assets/images/budgethub-light-logo.png"
              alt="company logo"
              width={140}
              height={40}
              className="object-contain transition-all duration-300"
              priority
            />
          ) : (
            <Image
              src="/assets/images/budgetch-small-logo.png"
              alt="company small logo"
              width={100}
              height={100}
              className="object-contain transition-all duration-300"
              priority
            />
          )}
        </div>
      </SidebarHeader>
      */}

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
