"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Rows4,
  ChartNoAxesCombined,
  CircleDotDashed,
  Luggage,
  ChartSpline,
  Download,
  LampWallUp,
  CircleQuestionMark,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Items {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function NavMain() {
  const { open } = useSidebar();
  const t = useTranslations("main-dashboard");
  const pathname = usePathname();

  const items: Items[] = [
    {
      title: t("sidebar.links.dashboard"),
      url: "/me/dashboard",
      icon: Home,
    },
    {
      title: t("sidebar.links.transactions"),
      url: "/me/transactions",
      icon: Rows4,
    },
    {
      title: t("sidebar.links.budgets"),
      url: "/me/budgets",
      icon: ChartNoAxesCombined,
    },
    {
      title: t("sidebar.links.savings"),
      url: "/me/saving-goals",
      icon: CircleDotDashed,
    },
    {
      title: t("sidebar.links.content"),
      url: "/me/content",
      icon: Luggage,
    },
    {
      title: t("sidebar.links.reports"),
      url: "/me/reports",
      icon: ChartSpline,
    },
    {
      title: t("sidebar.links.imp-exp"),
      url: "/me/import-export",
      icon: Download,
    },
    {
      title: t("sidebar.links.settings"),
      url: "/me/settings",
      icon: LampWallUp,
    },
    {
      title: t("sidebar.links.help"),
      url: "/me/help",
      icon: CircleQuestionMark,
    },
    {
      title: t("sidebar.links.logout"),
      url: "#",
      icon: LogOut,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm font-bold">
        {t("sidebar.title")}
      </SidebarGroupLabel>
      <SidebarMenu className={cn(open ? "flex" : "")}>
        {items.map((item) => (
          <div key={item.title}>
            <Link key={item.title} href={item.url}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(
                    open
                      ? "flex !cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-6 transition-all duration-300 hover:border-blue-600"
                      : "",
                    pathname === item.url &&
                      "border-blue-600 bg-gray-100 dark:bg-zinc-700",
                  )}
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
            {(item.title === t("sidebar.links.reports") ||
              item.title === t("sidebar.links.help")) && <Separator />}
          </div>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
