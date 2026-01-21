"use server";

import { headers } from "next/headers";
import { requireRootAdmin } from "./admin-auth";
import { auth } from "@/lib/auth/auth";
import { adminMailer, mailer } from "@/lib/mailer";
import {
  createAdminInvitationDB,
  getAdminInvitationByTokenDB,
  markInvitationAcceptedDB,
  getAdminInvitationsDB,
  createAuditLogDB,
  generateReferenceId,
} from "@/db/admin-queries";
import { getUserByEmailDB, updateUser } from "@/db/queries";
import { grantSubscription } from "./admin-subscription-grant";
import { buildAdminInvitationEmailHtml } from "@/lib/email-templates/admin-invitation";
import type { AdminInvitation } from "@/db/schema";

// ============================================
// CREATE INVITATION
// ============================================

export interface CreateInvitationParams {
  email: string;
  role: "user" | "admin";
  subscriptionPlan?: "individual" | "family" | null;
  subscriptionMonths?: number | null;
}

export async function createAdminInvitation(params: CreateInvitationParams) {
  const hdrs = await headers();
  const { userId: adminId, user: adminUser } = await requireRootAdmin(hdrs);

  const { email, role, subscriptionPlan, subscriptionMonths } = params;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  // Validate subscription params
  if (subscriptionPlan && !subscriptionMonths) {
    return {
      success: false,
      message: "Subscription months required when plan is specified",
    };
  }
  if (subscriptionMonths && (subscriptionMonths < 1 || subscriptionMonths > 24)) {
    return {
      success: false,
      message: "Subscription months must be between 1 and 24",
    };
  }

  try {
    // Generate secure token (32 bytes)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    // 14-day expiry
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Create invitation record
    const invitation = await createAdminInvitationDB({
      email,
      role,
      subscriptionPlan: subscriptionPlan ?? null,
      subscriptionMonths: subscriptionMonths ?? null,
      token,
      expiresAt,
      createdBy: adminId,
    });

    // Get recipient's language preference if they exist
    const existingUser = await getUserByEmailDB(email);
    const locale = existingUser?.language || adminUser.language || "en";

    // Build invitation link
    const link = `${process.env.BETTER_AUTH_URL}/accept-admin-invitation?token=${token}`;

    // Build email content
    const { subject, html } = await buildAdminInvitationEmailHtml({
      link,
      role,
      subscriptionPlan: subscriptionPlan ?? null,
      subscriptionMonths: subscriptionMonths ?? null,
      locale,
    });

    // Send invitation email
    await adminMailer.sendMail({
      from: `"BudgetHub" <${process.env.MAIL_ADMIN_USER || process.env.MAIL_USER!}>`,
      to: email,
      subject,
      html,
    });

    // Create audit log
    const reference = generateReferenceId();
    await createAuditLogDB({
      action: "invitation_created",
      affectedUserId: existingUser?.id ?? null,
      adminId,
      reference,
      metadata: {
        email,
        role,
        subscriptionPlan,
        subscriptionMonths,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      success: true,
      message: "Invitation sent successfully",
      data: invitation,
    };
  } catch (err) {
    console.error("Error creating admin invitation:", err);
    return {
      success: false,
      message: `Failed to create invitation: ${(err as Error).message}`,
    };
  }
}

// ============================================
// ACCEPT INVITATION
// ============================================

export interface AcceptInvitationResult {
  success: boolean;
  message: string;
  status?:
    | "accepted"
    | "not_authenticated"
    | "no_account"
    | "email_mismatch"
    | "expired"
    | "already_accepted"
    | "error";
}

export async function acceptAdminInvitation(
  token: string,
): Promise<AcceptInvitationResult> {
  const hdrs = await headers();

  // Check if user is authenticated
  const session = await auth.api.getSession({ headers: hdrs });

  if (!session?.user) {
    return {
      success: false,
      message: "Please log in to accept this invitation",
      status: "not_authenticated",
    };
  }

  const user = session.user;

  try {
    // Get invitation by token
    const invitation = await getAdminInvitationByTokenDB(token);

    if (!invitation) {
      return {
        success: false,
        message: "Invalid invitation link",
        status: "error",
      };
    }

    // Check if already accepted
    if (invitation.accepted) {
      return {
        success: false,
        message: "This invitation has already been used",
        status: "already_accepted",
      };
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return {
        success: false,
        message: "This invitation has expired",
        status: "expired",
      };
    }

    // Check email match
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return {
        success: false,
        message: "This invitation was sent to a different email address",
        status: "email_mismatch",
      };
    }

    // Accept the invitation
    await markInvitationAcceptedDB(invitation.id);

    // Update user role if needed
    if (invitation.role === "admin") {
      await updateUser(user.id, { role: "admin" });
    }

    // Grant subscription if specified
    if (invitation.subscriptionPlan && invitation.subscriptionMonths) {
      const grantResult = await grantSubscription({
        userId: user.id,
        plan: invitation.subscriptionPlan as "individual" | "family",
        months: invitation.subscriptionMonths,
        adminId: invitation.createdBy,
      });

      if (!grantResult.success) {
        console.error("Failed to grant subscription:", grantResult.message);
        // Don't fail the invitation acceptance, just log the error
      }
    }

    // Create audit log
    const reference = generateReferenceId();
    await createAuditLogDB({
      action: "invitation_accepted",
      affectedUserId: user.id,
      adminId: invitation.createdBy,
      reference,
      metadata: {
        email: user.email,
        role: invitation.role,
        subscriptionPlan: invitation.subscriptionPlan,
        subscriptionMonths: invitation.subscriptionMonths,
      },
    });

    return {
      success: true,
      message: "Invitation accepted successfully",
      status: "accepted",
    };
  } catch (err) {
    console.error("Error accepting admin invitation:", err);
    return {
      success: false,
      message: `Failed to accept invitation: ${(err as Error).message}`,
      status: "error",
    };
  }
}

// ============================================
// GET INVITATIONS
// ============================================

export async function getAdminInvitations(): Promise<{
  success: boolean;
  message?: string;
  data?: AdminInvitation[];
}> {
  const hdrs = await headers();
  await requireRootAdmin(hdrs);

  try {
    const invitations = await getAdminInvitationsDB();
    return { success: true, data: invitations };
  } catch (err) {
    console.error("Error fetching admin invitations:", err);
    return {
      success: false,
      message: `Failed to fetch invitations: ${(err as Error).message}`,
    };
  }
}

// ============================================
// GET INVITATION BY TOKEN (public - for accept page)
// ============================================

export async function getInvitationByToken(
  token: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    email: string;
    role: "user" | "admin";
    hasSubscription: boolean;
    subscriptionPlan?: string | null;
    subscriptionMonths?: number | null;
    expired: boolean;
    accepted: boolean;
  };
}> {
  try {
    const invitation = await getAdminInvitationByTokenDB(token);

    if (!invitation) {
      return { success: false, message: "Invalid invitation" };
    }

    return {
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        hasSubscription: !!(
          invitation.subscriptionPlan && invitation.subscriptionMonths
        ),
        subscriptionPlan: invitation.subscriptionPlan,
        subscriptionMonths: invitation.subscriptionMonths,
        expired: new Date() > invitation.expiresAt,
        accepted: invitation.accepted,
      },
    };
  } catch (err) {
    console.error("Error fetching invitation by token:", err);
    return {
      success: false,
      message: `Failed to fetch invitation: ${(err as Error).message}`,
    };
  }
}
