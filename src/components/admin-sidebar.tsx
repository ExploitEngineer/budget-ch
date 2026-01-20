"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Shield,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { Spinner } from "./ui/spinner";
import { useTranslations } from "next-intl";

interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  onClick?: () => Promise<void>;
}

export function AdminSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { email: string; name: string };
}) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { open } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Error logging out", err);
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  const navItems: NavItem[] = [
    {
      title: t("sidebar.overview"),
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: t("sidebar.users"),
      url: "/admin/users",
      icon: Users,
    },
    {
      title: t("sidebar.audit"),
      url: "/admin/audit",
      icon: ScrollText,
    },
    {
      title: t("sidebar.compliance"),
      url: "/admin/compliance",
      icon: Shield,
    },
  ];

  const bottomItems: NavItem[] = [
    {
      title: t("sidebar.back-to-app"),
      url: "/me/dashboard",
      icon: ArrowLeft,
    },
    {
      title: t("sidebar.logout"),
      icon: LogOut,
      onClick: handleLogout,
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "dark:bg-blue-background bg-gray-100/55",
        open ? "p-2" : "p-0"
      )}
    >
      <SidebarHeader
        className={cn(
          "dark:bg-blue-background flex items-center justify-start transition-all duration-300",
          open ? "pb-3" : "pb-0"
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-[#8C98B2]">
            {t("sidebar.navigation")}
          </SidebarGroupLabel>
          <SidebarMenu className={cn(open ? "flex" : "")}>
            {navItems.map((item) => (
              <Link key={item.title} href={item.url || ""}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(
                      open
                        ? "flex !cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-5 ring-0 transition-all duration-300 hover:border-blue-600 focus:ring-0 hover:focus:ring-0 dark:hover:border-[#2B365C] hover:dark:bg-[#141B2C]"
                        : "",
                      pathname === item.url &&
                        "border-blue-600 bg-gray-100 dark:border-[#2B365C] dark:bg-[#141A2C]"
                    )}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="dark:bg-blue-background">
        <Separator className="dark:bg-[#1A2441] mb-2" />
        <SidebarMenu className={cn(open ? "flex" : "")}>
          {bottomItems.map((item) => (
            <div key={item.title}>
              {item.onClick ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    disabled={isLoading}
                    onClick={item.onClick}
                    className={cn(
                      open
                        ? "flex !cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-5 ring-0 transition-all duration-300 hover:border-blue-600 focus:ring-0 hover:focus:ring-0 dark:hover:border-[#2B365C] hover:dark:bg-[#141B2C]"
                        : ""
                    )}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{isLoading ? <Spinner /> : item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Link href={item.url || ""}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className={cn(
                        open
                          ? "flex !cursor-pointer items-center gap-2 rounded-xl border border-transparent px-3 py-5 ring-0 transition-all duration-300 hover:border-blue-600 focus:ring-0 hover:focus:ring-0 dark:hover:border-[#2B365C] hover:dark:bg-[#141B2C]"
                          : ""
                      )}
                      tooltip={item.title}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Link>
              )}
            </div>
          ))}
        </SidebarMenu>

        {/* User Info */}
        {open && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-[#141A2C]">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
