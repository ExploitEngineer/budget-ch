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

export function NavUser() {
  const t = useTranslations("main-dashboard.sidebar.footer");
  const { open } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex w-full items-center gap-4">
        {open ? (
          <div className="flex w-full flex-col items-center justify-center gap-2">
            <div className="flex w-full items-center justify-between">
              <LangSwitcherDefault />
              <ThemeToggleDropdown />
              <div className="flex cursor-pointer items-center rounded-full border bg-gray-100 px-4 py-3 text-xs dark:bg-transparent">
                Plan: <span className="ml-1 font-medium">Free</span>
              </div>
            </div>
            <p className="flex items-center gap-1 text-xs text-gray-400">
              {t("content-1")}{" "}
              <Heart size={10} fill="currentColor" className="text-red-600" />
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
                  Plan: <span className="ml-1 font-medium">Free</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
