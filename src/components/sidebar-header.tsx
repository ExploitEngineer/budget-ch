"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DashBoardDialog from "./dialogs/dashboard-dialog";
import { useTranslations } from "next-intl";

const monthNames: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SidebarHeader() {
  const today = new Date();
  const t = useTranslations("main-dashboard");
  const [date, setDate] = useState(
    new Date(today.getFullYear(), today.getMonth()),
  );

  const goToPrevMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  return (
    <header className="mb-2 flex h-16 shrink-0 items-center gap-2 p-2 pt-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />

        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        <div className="flex w-full items-center gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder={t("sidebar.header.search")}
              className="rounded-lg py-5 pr-3 pl-9"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium whitespace-nowrap">
              {monthNames[date.getMonth()]} {date.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Dialog>
            <DialogTrigger className="min-w-40 cursor-pointer" asChild>
              <Button
                className="flex items-center gap-2"
                variant="default"
                size="icon"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">
                  {t("dashboard-page.dialog-box.title")}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DashBoardDialog />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
