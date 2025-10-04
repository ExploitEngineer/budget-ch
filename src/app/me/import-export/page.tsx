import SidebarHeader from "@/components/sidebar-header";
import { Export } from "./_components/export";
import { Import } from "./_components/import";

export default function Report() {
  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Export />
        <Import />
      </div>
    </section>
  );
}
