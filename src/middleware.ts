import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Redirect to the signin page if the session cookie is not present
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Sync URL query parameter (?hub=id) to cookie for server-side access
  const hubId = request.nextUrl.searchParams.get("hub");
  const response = NextResponse.next();

  if (hubId) {
    // Validate hub ID format (basic check)
    if (hubId.match(/^[a-zA-Z0-9-_]+$/)) {
      response.cookies.set("activeHubId", hubId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  // Use a broad matcher to let the middleware function handle the specific path logic
  matcher: ["/me/:path*"],
};
