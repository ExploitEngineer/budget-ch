"use server";

import { mailer } from "@/lib/mailer";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function sendSupportEmail(
    message: string,
    subject?: string
): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        if (!message || message.trim().length < 10) {
            return {
                success: false,
                message: "Please provide a detailed message (at least 10 characters).",
            };
        }

        // Get current user session
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        const userEmail = session?.user?.email || "Anonymous";
        const userName = session?.user?.name || "Unknown User";

        const emailSubject = subject?.trim()
            ? `[BudgetHub Support] ${subject.trim()}`
            : `[BudgetHub Support] Feedback from ${userName}`;

        // Send email to support
        await mailer.sendMail({
            from: `"BudgetHub Support" <${process.env.MAIL_USER!}>`,
            to: process.env.MAIL_USER!, // Send to support email (same as sender for now)
            replyTo: userEmail,
            subject: emailSubject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #235FE3;">New Support Request</h2>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;" />
          <p><strong>From:</strong> ${userName} (${userEmail})</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;" />
          <h3>Message:</h3>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 8px;">
            ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </p>
          <hr style="margin: 32px 0; border: 0; border-top: 1px solid #ddd;" />
          <p style="text-align: center; font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} BudgetHub. All rights reserved.
          </p>
        </div>
      `,
        });

        return {
            success: true,
            message: "Your message has been sent successfully!",
        };
    } catch (error) {
        console.error("Failed to send support email:", error);
        return {
            success: false,
            message: "Failed to send your message. Please try again later.",
        };
    }
}
