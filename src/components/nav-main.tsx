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
  ScrollText,
  ChartNoAxesCombined,
  CircleDotDashed,
  UserRound,
  ChartSpline,
  Download,
  Settings,
  CircleQuestionMark,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";

interface Items {
  title: string;
  url?: string;
  icon: LucideIcon;
  onClick?: () => Promise<void>;
}

export function NavMain() {
  const { open, setOpenMobile } = useSidebar();
  const router = useRouter();
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
      icon: ScrollText,
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
      url: "/me/accounts",
      icon: UserRound,
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
      icon: Settings,
    },
    {
      title: t("sidebar.links.help"),
      url: "/me/help",
      icon: CircleQuestionMark,
    },
    {
      title: t("sidebar.links.logout"),
      icon: LogOut,
      onClick: async () => {
        await authClient.signOut();
        router.push("/signin");
      },
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-bold text-[#8C98B2]">
        {t("sidebar.title")}
      </SidebarGroupLabel>
      <SidebarMenu className={cn(open ? "flex" : "")}>
        {items.map((item) => (
          <div
            key={item.title}
            onClick={async () => {
              setOpenMobile(false);
              if (item.onClick) {
                await item.onClick();
              }
            }}
          >
            <Link key={item.title} href={item.url || ""}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(
                    open
                      ? "flex !cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-5 ring-0 transition-all duration-300 hover:border-blue-600 focus:ring-0 hover:focus:ring-0 dark:hover:border-[#2B365C] hover:dark:bg-[#141B2C]"
                      : "",
                    pathname === item.url &&
                      "border-blue-600 bg-gray-100 dark:border-[#2B365C] dark:bg-[#141A2C]",
                  )}
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
            {(item.title === t("sidebar.links.reports") ||
              item.title === t("sidebar.links.help")) && (
              <Separator className="dark:bg-[#1A2441]" />
            )}
          </div>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
