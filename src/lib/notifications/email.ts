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

    // Special handling for recurring payment summary - custom HTML template
    let customHtml: string | null = null;
    if (typeKey === "recurring-payment-summary" && metadata) {
      customHtml = generateRecurringPaymentSummaryHTML(metadata, title, t, locale);
    }

    await mailer.sendMail({
      from: `"BudgetHub" <${process.env.MAIL_USER!}>`,
      to: recipientEmail,
      subject: title,
      html:
        customHtml ||
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
    console.error("Error sending notification email:", err);
  }
}

// Helper function to generate HTML for recurring payment summary
function generateRecurringPaymentSummaryHTML(
  metadata: Record<string, any>,
  title: string,
  t: (key: string) => string,
  locale: string,
): string {
  const successItems = (metadata.successItems || []) as Array<{ name: string; amount: number }>;
  const failedItems = (metadata.failedItems || []) as Array<{ name: string; amount: number; reason: string }>;
  const skippedItems = (metadata.skippedItems || []) as Array<{ name: string; nextDue: string }>;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CHF' }).format(amount);
  };

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <h2 style="color: #235FE3; margin-bottom: 24px;">📊 ${title}</h2>
  `;

  // Success section
  if (successItems.length > 0) {
    html += `
      <div style="background: white; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #10b981; font-size: 16px;">✅ ${t("notifications.types.recurring-payment-summary.success").replace("{count}", String(successItems.length))}</h3>
        <ul style="margin: 0; padding-left: 20px;">
    `;
    successItems.forEach(item => {
      html += `<li style="margin-bottom: 8px;"><strong>${item.name}</strong> – ${formatAmount(item.amount)}</li>`;
    });
    html += `
        </ul>
      </div>
    `;
  }

  // Failed section
  if (failedItems.length > 0) {
    html += `
      <div style="background: white; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #ef4444; font-size: 16px;">❌ ${t("notifications.types.recurring-payment-summary.failed").replace("{count}", String(failedItems.length))}</h3>
        <ul style="margin: 0; padding-left: 20px;">
    `;
    failedItems.forEach(item => {
      html += `
        <li style="margin-bottom: 12px;">
          <strong>${item.name}</strong> – ${formatAmount(item.amount)}<br/>
          <span style="color: #666; font-size: 14px;">Reason: ${item.reason}</span>
        </li>
      `;
    });
    html += `
        </ul>
      </div>
    `;
  }

  // Skipped section
  if (skippedItems.length > 0) {
    html += `
      <div style="background: white; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #f59e0b; font-size: 16px;">⏭️ ${t("notifications.types.recurring-payment-summary.skipped").replace("{count}", String(skippedItems.length))}</h3>
        <ul style="margin: 0; padding-left: 20px;">
    `;
    skippedItems.forEach(item => {
      html += `<li style="margin-bottom: 8px;"><strong>${item.name}</strong> – ${t("notifications.types.recurring-payment-summary.nextDue").replace("{date}", item.nextDue)}</li>`;
    });
    html += `
        </ul>
      </div>
    `;
  }

  html += `
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">
        © ${new Date().getFullYear()} BudgetHub. All rights reserved.
      </p>
    </div>
  `;

  return html;
}
