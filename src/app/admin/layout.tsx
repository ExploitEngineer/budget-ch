import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserType } from "@/db/schema";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = session.user as UserType;
  const t = await getTranslations("admin");

  console.log("[AdminLayout] User:", user);

  // Check if user is admin
  if (user.role !== "admin") {
    redirect("/me/dashboard");
  }

  // Check if user is banned
  if (user.banned) {
    redirect("/me/dashboard");
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        user={{
          name: user.name,
          email: user.email,
        }}
      />
      <SidebarInset className="bg-gray-100/55 dark:![background:var(--fancy-gradient)]">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-semibold text-sm">{t("overview.title")}</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
