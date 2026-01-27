"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getContext } from "@/lib/auth/actions";
import db from "@/db/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { createOTP } from "@better-auth/utils/otp";

export async function enableTwoFactor(password: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.enableTwoFactor({
      body: {
        password,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Two-factor authentication setup initiated",
      data: result,
    };
  } catch (err: any) {
    console.error("Error enabling two-factor authentication:", err);
    return {
      success: false,
      message: `Failed to enable two-factor authentication: ${err.message}`,
      data: null,
    };
  }
}

export async function verifyTotpCode(code: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.verifyTOTP({
      body: {
        code,
        trustDevice: true,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Two-factor authentication enabled successfully",
      data: result,
    };
  } catch (err: any) {
    console.error("Error verifying TOTP code:", err);
    return {
      success: false,
      message: `Failed to verify code: ${err.message || "Invalid verification code"}`,
      data: null,
    };
  }
}

export async function disableTwoFactor(password: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.disableTwoFactor({
      body: {
        password,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Two-factor authentication disabled successfully",
      data: result,
    };
  } catch (err: any) {
    console.error("Error disabling two-factor authentication:", err);
    return {
      success: false,
      message: `Failed to disable two-factor authentication: ${err.message}`,
      data: null,
    };
  }
}

export async function getTotpUri(password: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.getTOTPURI({
      body: {
        password,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "TOTP URI retrieved successfully",
      data: result,
    };
  } catch (err: any) {
    console.error("Error getting TOTP URI:", err);
    return {
      success: false,
      message: `Failed to get TOTP URI: ${err.message}`,
      data: null,
    };
  }
}

export async function viewBackupCodes() {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.viewBackupCodes({
      body: {
        userId: session.user.id,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Backup codes retrieved successfully",
      data: result,
    };
  } catch (err: any) {
    console.error("Error viewing backup codes:", err);
    return {
      success: false,
      message: `Failed to view backup codes: ${err.message}`,
      data: null,
    };
  }
}

export async function regenerateBackupCodes(password: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    const result = await auth.api.generateBackupCodes({
      body: {
        password,
      },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Backup codes regenerated successfully",
      data: result,
    };
  } catch (err: any) {
    console.error("Error regenerating backup codes:", err);
    return {
      success: false,
      message: `Failed to regenerate backup codes: ${err.message}`,
      data: null,
    };
  }
}

export async function getTwoFactorStatus() {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    return {
      success: true,
      message: "Two-factor status retrieved successfully",
      data: {
        twoFactorEnabled: session.user.twoFactorEnabled || false,
      },
    };
  } catch (err: any) {
    console.error("Error getting two-factor status:", err);
    return {
      success: false,
      message: `Failed to get two-factor status: ${err.message}`,
      data: null,
    };
  }
}

export async function setPasswordForUser(newPassword: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
        data: null,
      };
    }

    await auth.api.setPassword({
      body: { newPassword },
      headers: hdrs,
    });

    return {
      success: true,
      message: "Password set successfully",
      data: null,
    };
  } catch (err: any) {
    console.error("Error setting password:", err);
    return {
      success: false,
      message: `Failed to set password: ${err.message}`,
      data: null,
    };
  }
}

export async function verifyTotpForOAuth(code: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.user.twoFactorEnabled) {
      return { success: false, message: "Two-factor authentication is not enabled" };
    }

    const twoFactorRecord = await db.query.twoFactor.findFirst({
      where: eq(schema.twoFactor.userId, session.user.id),
    });

    if (!twoFactorRecord) {
      return { success: false, message: "TOTP not configured" };
    }

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      return { success: false, message: "Server configuration error" };
    }

    const decryptedSecret = await symmetricDecrypt({
      key: secret,
      data: twoFactorRecord.secret,
    });

    const isValid = await createOTP(decryptedSecret, {
      period: 30,
      digits: 6,
    }).verify(code);

    if (!isValid) {
      return { success: false, message: "Invalid verification code" };
    }

    return { success: true, message: "Verified successfully" };
  } catch (err: any) {
    console.error("Error verifying TOTP for OAuth:", err);
    return { success: false, message: "Verification failed" };
  }
}

export async function verifyBackupCodeForOAuth(code: string) {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.user.twoFactorEnabled) {
      return { success: false, message: "Two-factor authentication is not enabled" };
    }

    const twoFactorRecord = await db.query.twoFactor.findFirst({
      where: eq(schema.twoFactor.userId, session.user.id),
    });

    if (!twoFactorRecord) {
      return { success: false, message: "Backup codes not configured" };
    }

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      return { success: false, message: "Server configuration error" };
    }

    const decryptedCodes = await symmetricDecrypt({
      key: secret,
      data: twoFactorRecord.backupCodes,
    });

    const backupCodes: string[] = JSON.parse(decryptedCodes);
    const normalizedInput = code.replace(/[-\s]/g, "").toLowerCase();

    const matchIndex = backupCodes.findIndex(
      (c) => c.replace(/[-\s]/g, "").toLowerCase() === normalizedInput,
    );

    if (matchIndex === -1) {
      return { success: false, message: "Invalid backup code" };
    }

    // Remove used code and update DB
    const updatedCodes = backupCodes.filter((_, i) => i !== matchIndex);
    const encryptedCodes = await symmetricEncrypt({
      key: secret,
      data: JSON.stringify(updatedCodes),
    });

    await db
      .update(schema.twoFactor)
      .set({ backupCodes: encryptedCodes })
      .where(eq(schema.twoFactor.userId, session.user.id));

    return { success: true, message: "Backup code verified successfully" };
  } catch (err: any) {
    console.error("Error verifying backup code for OAuth:", err);
    return { success: false, message: "Verification failed" };
  }
}

export async function checkHasPassword() {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });

    if (!session?.user) {
      return { success: false, data: false };
    }

    const account = await db.query.accounts.findFirst({
      where: and(
        eq(schema.accounts.userId, session.user.id),
        eq(schema.accounts.providerId, "credential")
      ),
    });

    return { success: true, data: !!account };
  } catch (err: any) {
    console.error("Error checking password status:", err);
    return { success: false, data: false };
  }
}

