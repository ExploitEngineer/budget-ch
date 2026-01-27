import { NextResponse } from "next/server";
import { mailer, supportMailer, adminMailer } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sender, recipient, password } = body;

    // Basic password protection
    if (password !== "test-password-budgethub-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sender || !recipient) {
      return NextResponse.json(
        { error: "Missing sender or recipient" },
        { status: 400 }
      );
    }

    let selectedMailer;
    let fromEmail;
    let senderName = "BudgetHub";

    switch (sender) {
      case "regular":
        selectedMailer = mailer;
        fromEmail = process.env.MAIL_USER;
        break;
      case "support":
        selectedMailer = supportMailer;
        fromEmail = process.env.MAIL_SUPPORT_USER || process.env.MAIL_USER;
        senderName = "BudgetHub Support";
        break;
      case "admin":
        selectedMailer = adminMailer;
        fromEmail = process.env.MAIL_ADMIN_USER || process.env.MAIL_USER;
        senderName = "BudgetHub Admin";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid sender: must be 'regular', 'support', or 'admin'" },
          { status: 400 }
        );
    }

    if (!selectedMailer) {
      return NextResponse.json(
        { error: "Mailer configuration not found" },
        { status: 500 }
      );
    }

    await selectedMailer.sendMail({
      from: `"${senderName}" <${fromEmail}>`,
      to: recipient,
      subject: `Test Email from ${sender}`,
      text: `This is a test email sent from the ${sender} mailer to verify SMTP configuration.`,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent from ${sender} to ${recipient}`,
    });
  } catch (error: any) {
    console.error("Error in send-test-email route:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
