import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    // Redirect to the signin page if the session cookie is not present
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Continue to the requested route if the session cookie exists
  return NextResponse.next();
}

export const config = {
  // Use a broad matcher to let the middleware function handle the specific path logic
  matcher: ["/me/:path*"],
};
