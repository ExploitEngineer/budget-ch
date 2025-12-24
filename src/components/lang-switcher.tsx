"use client";
import { useLocale } from "next-intl";
import { setLanguage } from "@/app/actions";
import { setLocalUserPreferences } from "@/lib/services/locat-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
];

export function LangSwitcher() {
  const currentLocale = useLocale();

  const handleLanguageChange = async (locale: string) => {
    // Update localStorage to keep in sync with Settings page preference
    setLocalUserPreferences({ language: locale as "en" | "fr" | "de" | "it" });

    const formData = new FormData();
    formData.append("locale", locale);
    formData.append("pathname", window.location.pathname);
    await setLanguage(formData);
  };

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="dark:bg-dark-blue-background dark:border-border-blue cursor-pointer bg-white px-3 py-1 text-center !text-xs [&>svg]:hidden">
        <SelectValue>{currentLocale.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent className="dark:bg-dark-blue-background min-w-12 bg-white">
        {languages.map((language) => (
          <SelectItem
            className="cursor-pointer justify-center px-1 !text-xs [&_span]:hidden"
            key={language.code}
            value={language.code}
          >
            {language.code.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LangSwitcherDefault() {
  const currentLocale = useLocale();

  const handleLanguageChange = async (locale: string) => {
    // Update localStorage to keep in sync with Settings page preference
    setLocalUserPreferences({ language: locale as "en" | "fr" | "de" | "it" });

    const formData = new FormData();
    formData.append("locale", locale);
    formData.append("pathname", window.location.pathname);
    await setLanguage(formData);
  };

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-fit rounded-lg bg-gray-100 [&>svg:last-child]:hidden">
        <Globe className="h-5 w-5" />
      </SelectTrigger>
      <SelectContent className="bg-blue-background">
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
