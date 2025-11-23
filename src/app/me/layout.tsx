import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultHubId } from "@/lib/services/hub";

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

  // Note: Hub ID is now managed via URL query parameter (?hub=id)
  // Middleware syncs it to cookie for server-side access
  // getContext() handles fallback to default hub if no param provided

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-100/55 dark:![background:var(--fancy-gradient)]">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
