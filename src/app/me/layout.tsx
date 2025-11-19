import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HubHydrator } from "@/components/hub-hydrator";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const activeHubId = cookieStore.get("activeHubId")?.value || null;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <HubHydrator hubId={activeHubId} />
      <SidebarInset className="bg-gray-100/55 dark:![background:var(--fancy-gradient)]">
        {" "}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
