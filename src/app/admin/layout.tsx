import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserType } from "@/db/schema";

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

  console.log("[AdminLayout] User:", user);

  // Check if user is root_admin
  if (user.role !== "root_admin") {
    redirect("/me/dashboard");
  }

  // Check if user is locked
  if (user.isLocked) {
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
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
