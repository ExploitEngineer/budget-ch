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

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: { email: string; name: string } }) {
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
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "dark:bg-blue-background bg-gray-100/55",
        open ? "p-2" : "p-0",
      )}
    >
      <SidebarHeader
        className={cn(
          "dark:bg-blue-background flex items-center justify-start transition-all duration-300",
          open ? "pb-3" : "pb-0",
        )}
      >
        <div className="relative m-0 flex h-auto w-full items-center justify-start p-0 pt-1">
          {open ? (
            <>
              <div className="relative me-9 h-[45px] w-full">
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/assets/images/dark-logo.png"
                      : "/assets/images/logo.png"
                  }
                  alt="company logo"
                  fill
                  className={cn(
                    "m-0 object-cover p-0",
                    resolvedTheme === "dark" ? "pe-10" : "pe-0",
                  )}
                  priority
                />
              </div>
            </>
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

      <SidebarContent className="dark:bg-blue-background">
        {open && (
          <div className="mx-auto flex gap-4 items-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="dark:bg-blue-background">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
