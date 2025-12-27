import {
    getUsersForReportsDB,
    getUserHubsDB,
    getReportSummaryDB
} from "@/db/queries";
import { mailer } from "@/lib/mailer";
import fs from "fs";
import path from "path";
import { startOfMonth, endOfMonth, subMonths, format, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";
import { enUS, de, fr, it } from "date-fns/locale";
import { getMailTranslations } from "@/lib/mail-translations";

const locales: Record<string, any> = { en: enUS, de, fr, it };

export async function sendAutomatedReports(frequency: 'monthly' | 'quarterly') {
    console.log(`Starting ${frequency} report generation...`);

    const usersResult = await getUsersForReportsDB(frequency);
    if (!usersResult.success || !usersResult.data) {
        console.error("Failed to fetch users for reports:", usersResult.message);
        return;
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (frequency === 'monthly') {
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
    } else {
        const lastQuarter = subQuarters(now, 1);
        startDate = startOfQuarter(lastQuarter);
        endDate = endOfQuarter(lastQuarter);
    }

    console.log(`Generating reports for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    for (const user of usersResult.data) {
        if (!user.email || user.notificationsEnabled === false) continue;
        await sendUserReport(user, startDate, endDate, frequency);
    }
}

export async function sendUserReport(user: any, startDate: Date, endDate: Date, frequency: 'monthly' | 'quarterly') {
    try {
        const hubsResult = await getUserHubsDB(user.id);
        if (!hubsResult.success || !hubsResult.data || hubsResult.data.length === 0) {
            console.log(`No hubs found for user ${user.email}`);
            return;
        }

        const t = await getMailTranslations(user.language);
        const hubSummaries = [];
        let totalIncome = 0;
        let totalExpense = 0;

        for (const hub of hubsResult.data) {
            const summaryResult = await getReportSummaryDB(hub.id, startDate, endDate);
            if (summaryResult.success && summaryResult.data) {
                hubSummaries.push({
                    name: hub.name,
                    spent: formatCurrency(summaryResult.data.expense),
                    savingRate: summaryResult.data.savingRate,
                });
                totalIncome += summaryResult.data.income;
                totalExpense += summaryResult.data.expense;
            }
        }

        if (hubSummaries.length === 0) {
            console.log(`No spending/income found for user ${user.email} for this period.`);
            return;
        }

        const locale = locales[user.language] || enUS;
        const periodName = frequency === 'monthly'
            ? format(startDate, 'MMMM yyyy', { locale })
            : `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`;

        const reportTypeKey = frequency === 'monthly' ? 'monthly-report' : 'quarterly-report';
        const subject = t(`notifications.types.${reportTypeKey}.title`);

        const html = generateReportHtml({
            userName: user.name || "User",
            periodName,
            totalIncome: formatCurrency(totalIncome),
            totalExpense: formatCurrency(totalExpense),
            hubs: hubSummaries,
            appUrl: "https://app.budgethub.ch/signin",
            labels: {
                introText: t("notifications.types.monthly-report.labels.introText"),
                totalIncome: t("notifications.types.monthly-report.labels.totalIncome"),
                totalExpense: t("notifications.types.monthly-report.labels.totalExpense"),
                spending: t("notifications.types.monthly-report.labels.spending"),
                savingRate: t("notifications.types.monthly-report.labels.savingRate"),
                viewDashboard: t("notifications.types.monthly-report.labels.viewDashboard"),
                footerText: t("notifications.types.monthly-report.labels.footerText"),
            }
        });

        await mailer.sendMail({
            from: `"BudgetHub Reports" <${process.env.MAIL_USER!}>`,
            to: user.email,
            subject: subject,
            html,
        });

        console.log(`Report sent to ${user.email}`);
    } catch (err) {
        console.error(`Failed to send report to ${user.email}:`, err);
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
    }).format(amount);
}

function generateReportHtml(data: any) {
    const templatePath = path.join(process.cwd(), "src/lib/notifications/report-template.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    // Simple template engine replacement
    template = template.replace(/{{userName}}/g, data.userName);
    template = template.replace(/{{periodName}}/g, data.periodName);
    template = template.replace(/{{totalIncome}}/g, data.totalIncome);
    template = template.replace(/{{totalExpense}}/g, data.totalExpense);
    template = template.replace(/{{appUrl}}/g, data.appUrl);

    // Labels
    template = template.replace(/{{introText}}/g, data.labels.introText);
    template = template.replace(/{{totalIncomeLabel}}/g, data.labels.totalIncome);
    template = template.replace(/{{totalExpenseLabel}}/g, data.labels.totalExpense);
    template = template.replace(/{{viewDashboardLabel}}/g, data.labels.viewDashboard);
    template = template.replace(/{{footerText}}/g, data.labels.footerText);

    const hubRows = data.hubs.map((hub: any) => `
    <div class="hub-section">
        <div class="hub-title">${hub.name}</div>
        <div class="budget-info">
            <span>${data.labels.spending}: <strong>${hub.spent}</strong></span>
            <span>${data.labels.savingRate}: <strong>${hub.savingRate}%</strong></span>
        </div>
    </div>
  `).join("");

    template = template.replace(/{{#hubs}}[\s\S]*?{{\/hubs}}/g, hubRows);

    return template;
}
