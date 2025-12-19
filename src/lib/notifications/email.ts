import { mailer } from "@/lib/mailer";
import { updateNotificationEmailSentDB } from "@/db/queries";
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
    await mailer.sendMail({
      from: `"Budget-ch" <${process.env.MAIL_USER!}>`,
      to: recipientEmail,
      subject: notification.title,
      html:
        notification.html ||
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #235FE3;">${notification.title}</h2>
          <p>${notification.message}</p>
          <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
          <p style="text-align: center; font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} Budget-ch. All rights reserved.
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
