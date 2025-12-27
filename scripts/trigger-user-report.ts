import "dotenv/config";
import { getUserByEmailDB } from "@/db/queries";
import { sendUserReport } from "@/lib/notifications/reports";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

async function triggerReport(email: string) {
    console.log(`Searching for user: ${email}`);

    // getUserByEmailDB returns the user object directly or null
    const user = await getUserByEmailDB(email);

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const startDate = startOfMonth(lastMonth);
    const endDate = endOfMonth(lastMonth);

    console.log(`Found user: ${user.name} (${user.id})`);
    console.log(`Triggering monthly report for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    await sendUserReport(user, startDate, endDate, 'monthly');
    console.log("Report trigger complete.");
}

const targetEmail = "abbasiahsan699@gmail.com";
triggerReport(targetEmail).catch(console.error);
