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
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Spinner } from "./ui/spinner";
import {
  canAccessFeature,
  FeatureAccessResult,
} from "@/lib/services/features-permission";
import { toast } from "sonner";
import { useHubNavigation } from "@/hooks/use-hub-navigation";

interface Items {
  title: string;
  url?: string;
  icon: LucideIcon;
  onClick?: () => Promise<void>;
}

export function NavMain() {
  const { open, setOpenMobile } = useSidebar();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const router = useRouter();
  const t = useTranslations("main-dashboard");
  const pathname = usePathname();
  const { getUrlWithHub } = useHubNavigation();

  useEffect((): void => {
    canAccessFeature("reports").then((res: FeatureAccessResult): void => {
      setHasAccess(res.canAccess);
    });
  }, []);

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      router.push("/signin");
    } catch (err) {
      console.error("Error logging out", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      onClick: handleLogout,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-bold text-[#8C98B2]">
        {t("sidebar.title")}
      </SidebarGroupLabel>
      <SidebarMenu className={cn(open ? "flex" : "")}>
        {items.map((item) => {
          const isRestricted =
            item.url === "/me/reports" && hasAccess === false;

          return (
            <div
              key={item.title}
              onClick={async (): Promise<void> => {
                setOpenMobile(false);
                if (item.onClick) {
                  await item.onClick();
                }

                if (isRestricted) {
                  toast.error(
                    "You are on free plan. Cannot access this feature.",
                  );
                }
              }}
            >
              <Link
                key={item.title}
                href={isRestricted ? "#" : (item.url ? getUrlWithHub(item.url) : "")}
                onClick={(e): false | void =>
                  isRestricted && e.preventDefault()
                }
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    disabled={item.onClick && isLoading}
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
                    <span>
                      {item.onClick && isLoading ? <Spinner /> : item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
              {(item.title === t("sidebar.links.reports") ||
                item.title === t("sidebar.links.help")) && (
                <Separator className="dark:bg-[#1A2441]" />
              )}
            </div>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
