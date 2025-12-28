import { sendAutomatedReports } from "@/lib/notifications/reports";

export const monthlyHandler = async () => {
    try {
        await sendAutomatedReports('monthly');
    } catch (error) {
        console.error("Error in monthly reports handler:", error);
    }
};

export const quarterlyHandler = async () => {
    try {
        await sendAutomatedReports('quarterly');
    } catch (error) {
        console.error("Error in quarterly reports handler:", error);
    }
};
