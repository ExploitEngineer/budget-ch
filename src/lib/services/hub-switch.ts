"use server";

import { cookies } from "next/headers";

export async function switchHub(hubId: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: "activeHubId",
    value: hubId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return { success: true };
}
