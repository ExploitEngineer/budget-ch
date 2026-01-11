"use client";

import SidebarHeader from "@/components/sidebar-header";
import { QuickAccess } from "./_components/quick-access";
import { useHelpSectionData } from "./_components/data";
import { FAQs as FAQS } from "./_components/faqs";
import { Content } from "./_components/content";
import { ContactSupport } from "./_components/contact-support";

export default function Help() {
  const { FAQs } = useHelpSectionData();

  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <QuickAccess />
        <section className="grid h-full w-full auto-rows-min gap-2 md:grid-cols-6">
          <div className="md:col-span-4 xl:col-span-5">
            <FAQS FAQs={FAQs} />
          </div>
          <div className="md:col-span-2 xl:col-span-1">
            <Content />
          </div>
        </section>
        <ContactSupport />
      </div>
    </section>
  );
}

