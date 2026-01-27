import { NextRequest, NextResponse } from "next/server";
import { buildAdminInvitationEmailHtml } from "@/lib/email-templates/admin-invitation";

const TEST_PASSWORD = process.env.TEST_ROUTE_PASSWORD || "test123";

export async function POST(request: NextRequest) {
    try {
        // Basic password protection
        const authHeader = request.headers.get("x-test-password");
        if (authHeader !== TEST_PASSWORD) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const {
            link = "https://example.com/accept-admin-invitation?token=test123",
            role = "user",
            subscriptionPlan = null,
            subscriptionMonths = null,
            locale = "en",
        } = body;

        const { subject, html } = await buildAdminInvitationEmailHtml({
            link,
            role,
            subscriptionPlan,
            subscriptionMonths,
            locale,
        });

        return NextResponse.json({ subject, html });
    } catch (error) {
        console.error("Error generating email preview:", error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    // Basic password protection via query param for easy browser testing
    const password = request.nextUrl.searchParams.get("password");
    if (password !== TEST_PASSWORD) {
        return NextResponse.json(
            { error: "Unauthorized. Pass ?password=xxx" },
            { status: 401 },
        );
    }

    const link =
        request.nextUrl.searchParams.get("link") ||
        "https://example.com/accept-admin-invitation?token=test123";
    const role =
        (request.nextUrl.searchParams.get("role") as "user" | "admin") || "user";
    const subscriptionPlan =
        (request.nextUrl.searchParams.get("subscriptionPlan") as
            | "individual"
            | "family") || null;
    const subscriptionMonths = request.nextUrl.searchParams.get("subscriptionMonths")
        ? parseInt(request.nextUrl.searchParams.get("subscriptionMonths")!, 10)
        : null;
    const locale = request.nextUrl.searchParams.get("locale") || "en";

    try {
        const { subject, html } = await buildAdminInvitationEmailHtml({
            link,
            role,
            subscriptionPlan,
            subscriptionMonths,
            locale,
        });

        // Return HTML directly for easy browser preview
        return new NextResponse(
            `<!DOCTYPE html>
<html>
<head>
    <title>${subject}</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .preview-info { background: #fff3cd; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
        .email-preview { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="preview-info">
        <strong>Subject:</strong> ${subject}<br>
        <strong>Params:</strong> role=${role}, plan=${subscriptionPlan}, months=${subscriptionMonths}, locale=${locale}
    </div>
    <div class="email-preview">
        ${html}
    </div>
</body>
</html>`,
            {
                headers: { "Content-Type": "text/html" },
            },
        );
    } catch (error) {
        console.error("Error generating email preview:", error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 },
        );
    }
}
