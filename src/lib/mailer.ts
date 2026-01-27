import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.MAIL_USER!,
    pass: process.env.MAIL_PASS!,
  },
  tls: {
    // Treat connection reset as a retry-able or non-fatal issue
    rejectUnauthorized: false,
  },
});

export const supportMailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.MAIL_SUPPORT_USER || process.env.MAIL_USER!,
    pass: process.env.MAIL_SUPPORT_PASS || process.env.MAIL_PASS!,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
