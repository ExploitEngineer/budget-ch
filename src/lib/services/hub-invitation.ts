"use server";

import {
  createHubInvitationDB,
  getHubInvitationsByHubDB,
  acceptInvitationDB,
  getHubMembersDB,
  getUserByEmailDB,
} from "@/db/queries";
import { headers } from "next/headers";
import { getContext } from "@/lib/auth/actions";
import { mailer } from "@/lib/mailer";
import { randomBytes } from "crypto";
import type { AccessRole } from "@/db/queries";

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

    const user = await getUserByEmailDB(email);
    if (!user?.id) return { success: false, message: "User not found" };

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

    const token = randomBytes(32).toString("hex");
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
      subject: "You're invited to join a Hub!",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #235FE3;">You're invited to join a Hub!</h2>
      <p>Hello,</p>
      <p>You have been invited to join a hub with the role: <strong>${role}</strong>.</p>
      <p style="margin: 20px 0;">
        <a href="${link}" style="
          display: inline-block;
          background-color: #235FE3;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
        ">
          Accept Invitation
        </a>
      </p>
      <p>Or copy and paste this link into your browser: <br/>
         <span style="word-break: break-all; color: #666;">${link}</span>
      </p>
      <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
      <hr />
      <p style="font-size: 12px; color: #999;">If you didn't expect this invitation, you can safely ignore this email.</p>
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
    const { userId } = await getContext(hdrs, false);

    if (!userId) return { success: false, message: "Not authenticated" };

    const res = await acceptInvitationDB(token, userId);
    if (!res.success) return res;

    return {
      success: true,
      message: "Invitation Accecpted Successfully",
      data: { hubId: res.data?.hubId },
    };
  } catch (err: any) {
    return { success: false, message: "Error accepting invitation" };
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
