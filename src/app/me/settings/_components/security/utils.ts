import { toast } from "sonner";
import { useTranslations } from "next-intl";

export const useCopyToClipboard = () => {
  const t = useTranslations("main-dashboard.settings-page.security-section");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("labels.two-factor.messages.copied"));
  };

  const copyAllBackupCodes = (backupCodes: string[]) => {
    if (backupCodes.length === 0) return;
    const allCodes = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success(t("labels.two-factor.messages.copied"));
  };

  return { copyToClipboard, copyAllBackupCodes };
};

