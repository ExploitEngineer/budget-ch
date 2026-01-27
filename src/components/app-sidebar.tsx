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
  const { } = useTheme();
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
                  src="/assets/images/logo.png"
                  alt="company logo"
                  fill
                  className="m-0 object-cover p-0 dark:hidden pe-0"
                  priority
                  sizes="100vw"
                />
                <Image
                  src="/assets/images/dark-logo.png"
                  alt="company logo"
                  fill
                  className="m-0 object-cover p-0 hidden dark:block pe-10"
                  priority
                  sizes="100vw"
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
                sizes="30px"
              />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="dark:bg-blue-background">
        {/*open && (
          <div className="mx-auto flex flex-col gap-1 w-full overflow-hidden px-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        )*/}
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="dark:bg-blue-background">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
