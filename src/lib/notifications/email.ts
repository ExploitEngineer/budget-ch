import { mailer } from "@/lib/mailer";
import { updateNotificationEmailSentDB, getUserByEmailDB } from "@/db/queries";
import { getMailTranslations } from "@/lib/mail-translations";
import type { Notification } from "@/db/schema";

/**
 * Sends a notification email (fire-and-forget, non-blocking)
 * Updates the emailSent flag in the database after successful send
 */
export async function sendNotificationEmail(
  notification: Notification,
  recipientEmail: string,
): Promise<void> {
  try {
    const user = await getUserByEmailDB(recipientEmail);
    const locale = user?.language || "en";
    const t = await getMailTranslations(locale);

    // Get typeKey from metadata or fall back to mapping notification.type
    const metadata = notification.metadata as Record<string, any> | null;
    const typeKey = metadata?.typeKey
      ? metadata.typeKey.toLowerCase().replace(/_/g, "-")
      : notification.type.toLowerCase().replace(/_/g, "-");

    const title = t(`notifications.types.${typeKey}.title`) || notification.title;
    let message = t(`notifications.types.${typeKey}.message`) || notification.message;

    // Basic variable interpolation if metadata exists
    if (notification.metadata && typeof notification.metadata === "object") {
      Object.entries(notification.metadata as Record<string, any>).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{${key}}`, "g"), String(value));
      });
    }

    await mailer.sendMail({
      from: `"BudgetHub" <${process.env.MAIL_USER!}>`,
      to: recipientEmail,
      subject: title,
      html:
        notification.html ||
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #235FE3;">${title}</h2>
          <p>${message}</p>
          <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
          <p style="text-align: center; font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} BudgetHub. All rights reserved.
          </p>
        </div>
      `,
    });

    // Update emailSent flag after successful send
    await updateNotificationEmailSentDB(notification.id);
  } catch (err) {
    // Log error but don't throw - email sending failures shouldn't break the flow
    console.error("Failed to send notification email:", err);
  }
}
