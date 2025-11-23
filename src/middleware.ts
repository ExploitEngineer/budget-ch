import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Redirect to the signin page if the session cookie is not present
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const response = NextResponse.next();
  const urlHubId = request.nextUrl.searchParams.get("hub");
  const cookieHubId = request.cookies.get("activeHubId")?.value;

  // Priority 1: If URL has hub param, sync it to cookie
  if (urlHubId && urlHubId.match(/^[a-zA-Z0-9-_]+$/)) {
    response.cookies.set("activeHubId", urlHubId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  // Priority 2: If cookie exists but URL doesn't have hub param, add it to URL
  if (cookieHubId && !urlHubId) {
    const url = request.nextUrl.clone();
    url.searchParams.set("hub", cookieHubId);
    return NextResponse.redirect(url);
  }

  // No cookie and no URL param - let client component handle default hub
  return response;
}

export const config = {
  // Use a broad matcher to let the middleware function handle the specific path logic
  matcher: ["/me/:path*"],
};
