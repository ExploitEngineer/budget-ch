import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { hubId } = await req.json();

  const res = NextResponse.json({ success: true });

  res.cookies.set("activeHubId", hubId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return res;
}
