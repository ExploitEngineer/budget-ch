"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sun, Moon, SunMoon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const t = useTranslations("authpages");

  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 py-1 dark:bg-zinc-900"
      onClick={toggleTheme}
    >
      <span>🌓</span>
      <span className="text-xs font-bold">
        {theme === "dark" ? t("light-mode") : t("dark-mode")}
      </span>
    </div>
  );
}

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-lg bg-gray-100"
          size="icon"
        >
          {theme === "system" ? (
            <SunMoon className="h-5 w-5" />
          ) : theme === "light" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-blue-background"
        side="right"
        align="end"
      >
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <SunMoon className="mr-2 h-4 w-4" />
          Auto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
