import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-100/55 dark:![background:var(--fancy-gradient)]">
        {" "}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
