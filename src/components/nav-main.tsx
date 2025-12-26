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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Spinner } from "./ui/spinner";
import {
  canAccessFeature,
  FeatureAccessResult,
} from "@/lib/services/features-permission";
import { toast } from "sonner";
import { clearQueryCache } from "@/components/providers/query-provider";

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
  const searchParams = useSearchParams();
  const currentHubId = searchParams.get("hub");

  // Build URL with current hub ID preserved
  const getUrlWithHub = (path: string): string => {
    if (currentHubId) {
      return `${path}?hub=${currentHubId}`;
    }
    return path;
  };

  useEffect((): void => {
    canAccessFeature("reports").then((res: FeatureAccessResult): void => {
      setHasAccess(res.canAccess);
    });
  }, []);

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Clear any localStorage caches related to the app
      if (typeof window !== "undefined") {
        // Clear hub-related caches
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("hub_") || key.startsWith("cache_") || key.startsWith("user_"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Clear React Query cache to prevent stale data with wrong hub ID
      clearQueryCache();

      // Sign out - server-side hook will clear the httpOnly activeHubId cookie
      await authClient.signOut();

      // Use hard refresh instead of soft navigation to completely clear all client state
      window.location.href = "/signin";
    } catch (err) {
      console.error("Error logging out", err);
      // Still try to redirect even on error
      window.location.href = "/signin";
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

  const handleNavigation = async (
    e: React.MouseEvent,
    item: Items,
    isRestricted: boolean,
  ): Promise<void> => {
    if (isRestricted) {
      e.preventDefault();
      toast.error("You are on free plan. Cannot access this feature.");
      return;
    }

    if (item.onClick) {
      e.preventDefault();
      await item.onClick();
      setOpenMobile(false);
      return;
    }

    if (item.url) {
      // Close sidebar after a brief delay to allow navigation to start
      // This fixes mobile navigation issues where closing the Sheet immediately
      // would prevent the Link click from completing
      setTimeout(() => setOpenMobile(false), 200);
    }
  };

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
            <div key={item.title}>
              <Link
                href={
                  isRestricted
                    ? "#"
                    : item.url
                      ? getUrlWithHub(item.url)
                      : ""
                }
                onClick={(e) => handleNavigation(e, item, isRestricted)}
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
