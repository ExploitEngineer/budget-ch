import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import db from "@/db/db";
import { hubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createFinancialAccount } from "@/db/queries";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = session.user;
  const { name, type, initialBalance, iban, note } = await req.json();

  console.log("User Id: ", user.id);

  try {
    const userHub = await db.query.hubs.findFirst({
      where: eq(hubs.userId, user.id),
    });

    if (!userHub) {
      return NextResponse.json(
        { message: "No hub found for current user" },
        { status: 404 },
      );
    }

    console.log("Hub User Id: ", userHub.userId);
    console.log("User Hub: ", userHub.id);

    const account = await createFinancialAccount({
      userId: user.id,
      hubId: userHub.id,
      name,
      type,
      initialBalance,
      iban,
      note,
    });

    return NextResponse.json({ success: true, account });
  } catch (err) {
    console.error("Error creating financial account:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create financial account" },
      { status: 500 },
    );
  }
}
