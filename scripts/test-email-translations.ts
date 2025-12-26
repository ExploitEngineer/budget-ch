/**
 * Test script to preview all email templates for ALL languages.
 * Usage: npx tsx scripts/test-email-translations.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { users } from "../src/db/schema";
import { getMailTranslations } from "../src/lib/mail-translations";
import fs from "fs";
import path from "path";

const TEST_EMAIL = "abbasiahsan699@gmail.com";
const SUPPORTED_LOCALES = ["en", "de", "fr", "it"];

async function generateEmailPreviewsForLocale(locale: string, userName: string, outputDir: string) {
  const t = await getMailTranslations(locale);
  const name = userName;

  const localeDir = path.join(outputDir, locale);
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }

  // 1. Password Reset Email
  const resetPasswordHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("emails.auth.reset-password.title")}</title>
  </head>
  <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
      <h2 style="text-align: center; color: #111;">${t("emails.auth.reset-password.title")}</h2>
      <p>${t("emails.auth.reset-password.hi", { name })}</p>
      <p>${t("emails.auth.reset-password.request")}</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="#" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${t("emails.auth.reset-password.button")}</a>
      </p>
      <p>${t("emails.auth.reset-password.fallback")}</p>
      <p style="color: #2563eb; word-break: break-all;">https://example.com/reset-password?token=xxx</p>
      <p>${t("emails.auth.reset-password.expire")}</p>
      <p>${t("emails.auth.reset-password.ignore")}</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.reset-password.footer")}</p>
    </div>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "reset-password.html"), resetPasswordHtml);

  // 2. Verify Email
  const verifyEmailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("emails.auth.verify-email.title")}</title>
  </head>
  <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
      <h2 style="text-align: center; color: #111;">${t("emails.auth.verify-email.title")}</h2>
      <p>${t("emails.auth.verify-email.hi")}</p>
      <p>${t("emails.auth.verify-email.thanks", { name })}</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="#" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">${t("emails.auth.verify-email.button")}</a>
      </p>
      <p>${t("emails.auth.verify-email.fallback")}</p>
      <p style="color: #2563eb; word-break: break-all;">https://example.com/verify?token=xxx</p>
      <p>${t("emails.auth.verify-email.expire")}</p>
      <p>${t("emails.auth.verify-email.ignore")}</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.verify-email.footer")}</p>
    </div>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "verify-email.html"), verifyEmailHtml);

  // 3. OTP Email
  const otpHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("emails.auth.otp.title")}</title>
  </head>
  <body style="font-family: sans-serif; background: #f4f4f4; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 32px; border-radius: 8px;">
      <h2 style="text-align: center; color: #111;">${t("emails.auth.otp.title")}</h2>
      <p>${t("emails.auth.otp.hi", { name })}</p>
      <p>${t("emails.auth.otp.code-is")}</p>
      <p style="text-align: center; margin: 32px 0;">
        <span style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 4px;">123456</span>
      </p>
      <p>${t("emails.auth.otp.expire")}</p>
      <p>${t("emails.auth.otp.ignore")}</p>
      <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
      <p style="text-align: center; font-size: 12px; color: #666;">${t("emails.auth.otp.footer")}</p>
    </div>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "otp.html"), otpHtml);

  // 4. Hub Invitation Email
  const role = "member";
  const invitationHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("emails.invitation.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("emails.invitation.title")}</h2>
    <p>${t("emails.invitation.hello")}</p>
    <p>${t("emails.invitation.invited", { role })}</p>
    <p style="margin: 20px 0;">
      <a href="#" style="display: inline-block; background-color: #235FE3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
        ${t("emails.invitation.button")}
      </a>
    </p>
    <p>${t("emails.invitation.fallback")} <br/>
       <span style="word-break: break-all; color: #666;">https://example.com/accept-invitation?token=xxx</span>
    </p>
    <p style="color: #999; font-size: 12px;">${t("emails.invitation.expire")}</p>
    <hr />
    <p style="font-size: 12px; color: #999;">${t("emails.invitation.ignore")}</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "invitation.html"), invitationHtml);

  // 5. Budget Threshold 80% Notification
  const categoryName = "Groceries";
  const budgetThreshold80Html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("notifications.types.budget-threshold-80.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("notifications.types.budget-threshold-80.title")}</h2>
    <p>${t("notifications.types.budget-threshold-80.message", { categoryName })}</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
    <p style="text-align: center; font-size: 12px; color: #666;">© ${new Date().getFullYear()} BudgetHub. All rights reserved.</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "notification-budget-80.html"), budgetThreshold80Html);

  // 6. Budget Threshold 100% Notification
  const budgetThreshold100Html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("notifications.types.budget-threshold-100.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("notifications.types.budget-threshold-100.title")}</h2>
    <p>${t("notifications.types.budget-threshold-100.message", { categoryName })}</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
    <p style="text-align: center; font-size: 12px; color: #666;">© ${new Date().getFullYear()} BudgetHub. All rights reserved.</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "notification-budget-100.html"), budgetThreshold100Html);

  // 7. Subscription Expiring 3 Days
  const subExpiring3Html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("notifications.types.subscription-expiring-3-days.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("notifications.types.subscription-expiring-3-days.title")}</h2>
    <p>${t("notifications.types.subscription-expiring-3-days.message")}</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
    <p style="text-align: center; font-size: 12px; color: #666;">© ${new Date().getFullYear()} BudgetHub. All rights reserved.</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "notification-sub-expiring-3.html"), subExpiring3Html);

  // 8. Subscription Expiring 1 Day
  const subExpiring1Html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("notifications.types.subscription-expiring-1-day.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("notifications.types.subscription-expiring-1-day.title")}</h2>
    <p>${t("notifications.types.subscription-expiring-1-day.message")}</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
    <p style="text-align: center; font-size: 12px; color: #666;">© ${new Date().getFullYear()} BudgetHub. All rights reserved.</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "notification-sub-expiring-1.html"), subExpiring1Html);

  // 9. Subscription Expired
  const subExpiredHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${t("notifications.types.subscription-expired.title")}</title>
  </head>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #235FE3;">${t("notifications.types.subscription-expired.title")}</h2>
    <p>${t("notifications.types.subscription-expired.message")}</p>
    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
    <p style="text-align: center; font-size: 12px; color: #666;">© ${new Date().getFullYear()} BudgetHub. All rights reserved.</p>
  </body>
</html>
  `;
  fs.writeFileSync(path.join(localeDir, "notification-sub-expired.html"), subExpiredHtml);

  console.log(`  📧 ${locale.toUpperCase()}: 9 email templates generated`);
}

async function generateAllEmailPreviews() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log("🔍 Fetching user data...");

  try {
    const user = await db.query.users.findFirst({
      where: eq(sql`lower(${users.email})`, TEST_EMAIL.toLowerCase()),
      columns: {
        id: true,
        name: true,
        email: true,
        language: true,
      },
    });

    const userName = user?.name || user?.email || "Test User";
    console.log(`✅ User: ${userName}\n`);

    const outputDir = path.join(process.cwd(), "email-previews");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("📧 Generating email previews for all languages...\n");

    for (const locale of SUPPORTED_LOCALES) {
      await generateEmailPreviewsForLocale(locale, userName, outputDir);
    }

    console.log(`\n✅ All email previews generated!`);
    console.log(`\n📂 Output folder: ${outputDir}`);
    console.log(`\n📁 Structure:`);
    console.log(`   email-previews/`);
    for (const locale of SUPPORTED_LOCALES) {
      console.log(`     └── ${locale}/`);
      console.log(`           ├── reset-password.html`);
      console.log(`           ├── verify-email.html`);
      console.log(`           ├── otp.html`);
      console.log(`           ├── invitation.html`);
      console.log(`           ├── notification-budget-80.html`);
      console.log(`           ├── notification-budget-100.html`);
      console.log(`           ├── notification-sub-expiring-3.html`);
      console.log(`           ├── notification-sub-expiring-1.html`);
      console.log(`           └── notification-sub-expired.html`);
    }
  } catch (err) {
    console.error("Error generating email previews:", err);
  } finally {
    await pool.end();
  }
}

generateAllEmailPreviews();
