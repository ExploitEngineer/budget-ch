"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { MainFormValues, mainFormSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  useBrowserNotifications,
  isBrowserNotificationEnabled,
  setBrowserNotificationEnabled,
  requestNotificationPermission,
  getNotificationPermission,
} from "@/hooks/use-browser-notifications";

import { toast } from "sonner";
import {
  updateUserNotificationsEnabled,
  updateUserReportFrequency,
} from "@/lib/services/user";
import { Loader2 } from "lucide-react";

export function Notifications({
  notificationsEnabled: initialEnabled,
  reportFrequency: initialFrequency,
}: {
  notificationsEnabled: boolean;
  reportFrequency: string;
}) {
  const [globalEnabled, setGlobalEnabled] = useState(initialEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<MainFormValues>({
    resolver: zodResolver(mainFormSchema) as any,
    defaultValues: {
      account: initialFrequency || "off",
    },
  });
  const t = useTranslations(
    "main-dashboard.settings-page.notifications-section",
  );
  const browserT = useTranslations("notifications.browser");

  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
    useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");

  const {
    isSupported,
    requestPermission: requestBrowserPermission,
  } = useBrowserNotifications({ notifications: [] });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBrowserNotificationsEnabled(isBrowserNotificationEnabled());
      setPermissionStatus(getNotificationPermission());
    }
  }, []);

  const handleGlobalToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const res = await updateUserNotificationsEnabled(checked);
      if (res.success) {
        setGlobalEnabled(checked);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBrowserNotificationToggle = async (checked: boolean) => {
    if (checked) {
      // If enabling, check permission first
      const currentPermission = getNotificationPermission();
      if (currentPermission === "default") {
        // Request permission
        const permission = await requestBrowserPermission();
        if (permission === "granted") {
          setBrowserNotificationEnabled(true);
          setBrowserNotificationsEnabled(true);
          setPermissionStatus("granted");
        } else {
          setPermissionStatus(permission);
          return; // Don't enable if permission denied
        }
      } else if (currentPermission === "granted") {
        setBrowserNotificationEnabled(true);
        setBrowserNotificationsEnabled(true);
      } else {
        // Permission denied - show message
        setPermissionStatus("denied");
        return;
      }
    } else {
      setBrowserNotificationEnabled(false);
      setBrowserNotificationsEnabled(false);
    }
  };

  const emailAlertBadges: string[] = [
    t("labels.email-alerts.badges.budget"),
    t("labels.email-alerts.badges.budget-exceeded"),
    t("labels.email-alerts.badges.payment"),
  ];

  const pushBrowserBadges: string[] = [
    t("labels.push-browser.badges.new-transaction"),
    t("labels.push-browser.badges.savings"),
  ];

  return (
    <section>
      <Card className="bg-blue-background dark:border-border-blue relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
            <Checkbox
              id="global-notifications"
              checked={globalEnabled}
              onCheckedChange={handleGlobalToggle}
              disabled={isUpdating}
            />
            <label
              htmlFor="global-notifications"
              className="text-sm cursor-pointer font-medium"
            >
              {t("master-toggle")}
            </label>
          </div>
        </CardHeader>
        <Separator className="dark:bg-border-blue" />
        <CardContent className={!globalEnabled ? "opacity-50 pointer-events-none grayscale-[0.5]" : ""}>
          <div className="mb-5 grid grid-cols-2 gap-5">
            <div>
              <h3 className="mb-3 text-sm opacity-80">
                {t("labels.email-alerts.title")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {emailAlertBadges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm opacity-80">
                  {t("labels.push-browser.title")}
                </h3>
                {isSupported && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="browser-notifications"
                      checked={browserNotificationsEnabled}
                      onCheckedChange={handleBrowserNotificationToggle}
                      disabled={permissionStatus === "denied" || !globalEnabled}
                    />
                    <label
                      htmlFor="browser-notifications"
                      className="text-sm cursor-pointer"
                    >
                      {browserT("settings.deviceEnable")}
                    </label>
                  </div>
                )}
              </div>
              {isSupported && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  {browserT("settings.deviceDescription")}
                </p>
              )}
              {isSupported && permissionStatus === "denied" && (
                <p className="text-xs text-muted-foreground mb-2">
                  {browserT("settings.permissionDenied")}
                </p>
              )}
              {!isSupported && (
                <p className="text-xs text-muted-foreground mb-2">
                  {browserT("settings.notSupported")}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {pushBrowserBadges.map((badge) => (
                  <Badge
                    key={badge}
                    variant="outline"
                    className="dark:border-border-blue bg-badge-background rounded-full px-3 py-2"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Form {...form}>
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm">
                    {t("labels.monthly-report.title")}
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={async (value) => {
                        field.onChange(value);
                        setIsUpdating(true);
                        try {
                          const res = await updateUserReportFrequency(value);
                          if (res.success) {
                            toast.success(t("toasts.success"));
                          } else {
                            toast.error(t("toasts.error"));
                          }
                        } catch (err) {
                          toast.error("An error occurred");
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                    >
                      <SelectTrigger
                        disabled={!globalEnabled}
                        className="dark:border-border-blue !dark:bg-dark-blue-background w-full cursor-pointer"
                      >
                        <SelectValue
                          placeholder={t("labels.monthly-report.options.off")}
                        />
                      </SelectTrigger>
                      <SelectContent className="dark:!bg-dark-blue-background bg-white">
                        <SelectItem value="off">
                          {t("labels.monthly-report.options.off")}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t("labels.monthly-report.options.monthly")}
                        </SelectItem>
                        <SelectItem value="quarterly">
                          {t("labels.monthly-report.options.quarterly")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
