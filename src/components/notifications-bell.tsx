"use client";

import { Bell } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { formatDistanceToNow } from "date-fns";
import { de, fr, it, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

// Map locale codes to date-fns locales
const dateFnsLocales: Record<string, typeof enUS> = {
  en: enUS,
  de: de,
  fr: fr,
  it: it,
};

export function NotificationsBell() {
  const searchParams = useSearchParams();
  const hubId = searchParams.get("hub");
  const t = useTranslations("notifications");
  const currentLocale = useLocale();

  const { data: notifications = [], isLoading } = useNotifications({
    hubId,
    limit: 10,
  });

  // Fetch all unread notifications for browser notification detection
  const { data: allUnreadNotifications = [] } = useNotifications({
    hubId,
    unreadOnly: true,
    limit: 50, // Get more notifications for browser notification detection
  });

  const { data: unreadCount = 0 } = useNotificationCount(hubId);

  // Enable browser notifications - use all unread notifications for detection
  useBrowserNotifications({
    notifications: allUnreadNotifications,
    enabled: !!hubId,
  });

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    if (!hubId) return;
    await markAsRead.mutateAsync({ notificationId, hubId });
  };

  const handleMarkAllAsRead = async () => {
    if (!hubId) return;
    await markAllAsRead.mutateAsync(hubId);
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      case "info":
      default:
        return "bg-blue-500";
    }
  };

  // Map stored English titles to translation keys
  const getTranslatedContent = (notification: { title: string; message: string; metadata?: unknown }) => {
    // Map English titles to translation type keys
    const titleToTypeKey: Record<string, string> = {
      "Budget Threshold Reached": "budget-threshold-80",
      "Budget Exceeded": "budget-exceeded",
      "Subscription Expiring Soon": "subscription-expiring-3-days",
      "Subscription Expiring Tomorrow": "subscription-expiring-1-day",
      "Subscription Expired": "subscription-expired",
    };

    const typeKey = titleToTypeKey[notification.title];

    if (typeKey) {
      // Get category name from metadata if available
      const metadata = notification.metadata as { categoryName?: string } | null;
      const categoryName = metadata?.categoryName || "category";

      return {
        title: t(`types.${typeKey}.title`),
        message: t(`types.${typeKey}.message`, { categoryName }),
      };
    }

    // Fallback to original content for unknown notification types
    return {
      title: notification.title,
      message: notification.message,
    };
  };

  if (!hubId) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold text-sm">{t("title")}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            notifications.map((notification) => {
              const translated = getTranslatedContent(notification);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => {
                    if (!notification.isRead && hubId) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                        getNotificationTypeColor(notification.type),
                        notification.isRead && "opacity-50",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-medium text-sm",
                          notification.isRead && "text-muted-foreground",
                        )}
                      >
                        {translated.title}
                      </div>
                      <div
                        className={cn(
                          "text-xs text-muted-foreground mt-1",
                          notification.isRead && "opacity-75",
                        )}
                      >
                        {translated.message}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: dateFnsLocales[currentLocale] || enUS,
                        })}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
