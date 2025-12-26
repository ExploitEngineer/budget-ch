"use client";

import { useState, useCallback } from "react";
import SidebarHeader from "@/components/sidebar-header";
import { QuickAccess } from "./_components/quick-access";
import { useHelpSectionData } from "./_components/data";
import { FAQs as FAQS } from "./_components/faqs";
import { Content } from "./_components/content";
import { ContactSupport } from "./_components/contact-support";
import { KeyboardShortcuts } from "./_components/keyboard-shortcuts";
import { Privacy } from "./_components/privacy";
import { ReleaseNotes } from "./_components/release-notes";

export default function Help() {
  const { FAQs } = useHelpSectionData();
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);

  const openAllFaqs = useCallback(() => {
    setExpandedFaqs(FAQs.map((_, idx) => idx.toString()));
  }, [FAQs]);

  const closeAllFaqs = useCallback(() => {
    setExpandedFaqs([]);
  }, []);

  return (
    <section>
      <div>
        <SidebarHeader />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <QuickAccess onOpenAll={openAllFaqs} onCloseAll={closeAllFaqs} />
        <section className="grid h-full w-full auto-rows-min gap-2 md:grid-cols-6">
          <div className="md:col-span-4 xl:col-span-5">
            <FAQS FAQs={FAQs} expandedItems={expandedFaqs} onExpandedChange={setExpandedFaqs} />
          </div>
          <div className="md:col-span-2 xl:col-span-1">
            <Content />
          </div>
        </section>
        <ContactSupport />
        {/* <KeyboardShortcuts /> */}
        {/* <Privacy /> */}
        {/* <ReleaseNotes /> */}
      </div>
    </section>
  );
}

