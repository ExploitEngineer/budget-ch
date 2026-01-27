"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getContext } from "@/lib/auth/actions";

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

