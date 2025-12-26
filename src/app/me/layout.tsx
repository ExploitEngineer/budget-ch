import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HubSync } from "@/components/hub-sync";
import { UpgradeToastListener } from "@/components/upgrade-toast-listener";
import { SessionReadyProvider } from "@/hooks/use-session-ready";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  // Note: Hub ID is managed via cookie (source of truth)
  // Middleware syncs cookie to URL when navigating
  // HubSync component handles default hub when no cookie/URL param exists

  return (
    <SidebarProvider>
      <UpgradeToastListener />
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
      <HubSync />
      <SidebarInset className="bg-gray-100/55 dark:![background:var(--fancy-gradient)]">
        <SessionReadyProvider>
          {children}
        </SessionReadyProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
