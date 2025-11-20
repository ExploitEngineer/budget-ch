"use client";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { LangSwitcherDefault } from "./lang-switcher";
import { ThemeToggleDropdown } from "./theme-toggle";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { HubDisplay } from "./hub-display";
import { useState, useEffect } from "react";
import { canAccessFeature } from "@/lib/services/features-permission";

export function NavUser() {
  const t = useTranslations("main-dashboard.sidebar.footer");
  const { open } = useSidebar();

  const [plan, setPlan] = useState<string>("Family");

  useEffect(() => {
    (async () => {
      const res = await canAccessFeature("reports");

      if (!res.subscriptionPlan) {
        setPlan("Free");
      } else if (res.subscriptionPlan === "individual") {
        setPlan("Individual");
      } else if (res.subscriptionPlan === "family") {
        setPlan("Family");
      }
    })();
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex w-full items-center gap-4">
        {open ? (
          <div className="flex w-full flex-col justify-center gap-2">
            <div className="flex w-full items-center gap-3">
              <LangSwitcherDefault />
              <ThemeToggleDropdown />
              <div className="flex cursor-pointer items-center rounded-full border bg-gray-100 px-4 py-3 text-xs dark:bg-transparent">
                Plan: <span className="ml-1 font-medium">{plan}</span>
              </div>
            </div>
            <div className="dark:border-border-blue border-b p-4">
              <div className="mb-2 text-xs font-semibold text-gray-500">
                Current Hub
              </div>
              <HubDisplay />
            </div>
            <p className="flex items-center ps-1 text-xs text-gray-400">
              {t("content-1")}{" "}
              <Heart
                size={10}
                fill="currentColor"
                className="mx-1 text-red-600"
              />
              {t("content-2")}
            </p>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer" asChild>
              <button className="hover:bg-accent flex h-9 w-9 items-center justify-center rounded-md border">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="flex flex-col items-center space-y-1 p-2"
              side="right"
              align="end"
            >
              <div className="flex items-center gap-2">
                <DropdownMenuItem asChild>
                  <LangSwitcherDefault />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ThemeToggleDropdown />
                </DropdownMenuItem>
              </div>
              <DropdownMenuItem>
                <div className="flex cursor-pointer items-center rounded-full border px-4 py-3 text-xs">
                  Plan: <span className="ml-1 font-medium">{plan}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
