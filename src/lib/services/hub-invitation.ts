"use server";

import {
  createHubInvitationDB,
  getHubInvitationsByHubDB,
  acceptInvitationDB,
  deleteHubInvitationDB,
  getHubMembersDB,
  getUserByEmailDB,
  removeHubMemberDB,
} from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "@/lib/auth/actions";
import { mailer } from "@/lib/mailer";
import { getMailTranslations } from "@/lib/mail-translations";
import db from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AccessRole } from "@/db/queries";
import { requireAdminRole } from "@/lib/auth/permissions";

interface SendInvitationParams {
  hubId: string;
  email: string;
  role: AccessRole;
}

interface SendInvitationReturnType {
  success: boolean;
  message?: string;
  data?: [];
}

// SEND Invitation
export async function sendHubInvitation({
  hubId,
  email,
  role,
}: SendInvitationParams): Promise<SendInvitationReturnType> {
  try {
    const hdrs = await headers();
    const { userId } = await getContext(hdrs, false);

    if (!userId) return { success: false, message: "Not authenticated" };

    const recipientUser = await getUserByEmailDB(email);
    const inviterUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { language: true },
    });

    const locale = recipientUser?.language || "de" // || inviterUser?.language || "en";
    const t = await getMailTranslations(locale);

    const existingMembers = await getHubMembers(hubId);
    const isAlreadyMember = existingMembers.data?.some(
      (member) => member.email === email,
    );

    if (isAlreadyMember) {
      return {
        success: false,
        message: "User is already a member of this hub",
      };
    }

    // Generate a 32-byte random token using Web Crypto API (edge runtime compatible)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const expiresAt = new Date(Date.now() + 7 * 86400000);

    const res = await createHubInvitationDB({
      hubId,
      email,
      role,
      token,
      expiresAt,
    });

    if (!res.success) {
      return { success: false, message: "Failed to create invitation" };
    }

    const link = `${process.env.BETTER_AUTH_URL}/accept-invitation?token=${token}`;

    await mailer.sendMail({
      from: `"BudgetHub" <${process.env.MAIL_USER}>`,
      to: email,
      subject: t("emails.invitation.subject"),
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #235FE3;">${t("emails.invitation.title")}</h2>
      <p>${t("emails.invitation.hello")}</p>
      <p>${t("emails.invitation.invited", { role })}</p>
      <p style="margin: 20px 0;">
        <a href="${link}" style="
          display: inline-block;
          background-color: #235FE3;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
        ">
          ${t("emails.invitation.button")}
        </a>
      </p>
      <p>${t("emails.invitation.fallback")} <br/>
         <span style="word-break: break-all; color: #666;">${link}</span>
      </p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; font-size: 14px;">
        <p style="margin: 0 0 10px 0;"><strong>${t("emails.invitation.help-title")}</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li style="margin-bottom: 8px;">${t("emails.invitation.help-new-user")}</li>
          <li>${t("emails.invitation.help-existing-user")}</li>
        </ul>
      </div>
      <p style="color: #999; font-size: 12px;">${t("emails.invitation.expire")}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">${t("emails.invitation.ignore")}</p>
    </div>
  `,
    });

    return { success: true, message: "Invitation sent" };
  } catch (err) {
    return { success: false, message: "Email send error" };
  }
}

// GET Invitations
export async function getHubInvitations(hubId: string) {
  const hdrs = await headers();
  const { userId } = await getContext(hdrs, false);

  if (!userId)
    return { success: false, message: "Not authenticated", data: [] };

  return await getHubInvitationsByHubDB(hubId);
}

// ACCEPT Invitation
export async function acceptHubInvitation(token: string) {
  try {
    const hdrs = await headers();

    // Check authentication - getContext throws if not authenticated
    let userId: string;
    try {
      const context = await getContext(hdrs, false);
      userId = context.userId;
    } catch {
      return { success: false, message: "Not authenticated" };
    }

    const res = await acceptInvitationDB(token, userId);
    if (!res.success) return res;

    return {
      success: true,
      message: "Invitation Accepted Successfully",
      data: { hubId: res.data?.hubId },
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Error accepting invitation" };
  }
}

// GET Members
export async function getHubMembers(hubId: string) {
  const hdrs = await headers();
  const { userId } = await getContext(hdrs, false);

  if (!userId)
    return { success: false, message: "Not authenticated", data: [] };

  return await getHubMembersDB(hubId);
}

// DELETE Invitation
export async function deleteHubInvitation(invitationId: string, hubId: string) {
  try {
    const hdrs = await headers();

    // Check authentication
    try {
      await getContext(hdrs, false);
    } catch {
      return { success: false, message: "Not authenticated" };
    }

    const res = await deleteHubInvitationDB(invitationId, hubId);
    return res;
  } catch (err: any) {
    return { success: false, message: err.message || "Error deleting invitation" };
  }
}

// REMOVE Member
export async function removeHubMember(memberUserId: string, hubId: string) {
  try {
    const hdrs = await headers();
    const { userId, userRole } = await getContext(hdrs, false);

    if (!userId) return { success: false, message: "Not authenticated" };

    requireAdminRole(userRole);

    if (userId === memberUserId) {
      return { success: false, message: "Cannot remove yourself" };
    }

    return await removeHubMemberDB(memberUserId, hubId);
  } catch (err: any) {
    return { success: false, message: err.message || "Error removing member" };
  }
}
