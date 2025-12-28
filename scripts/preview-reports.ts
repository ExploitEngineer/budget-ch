import fs from "fs";
import path from "path";
import { enUS, de, fr, it } from "date-fns/locale";
import { format } from "date-fns";

const messagesDir = path.join(process.cwd(), "messages");
const templatePath = path.join(process.cwd(), "src/lib/notifications/report-template.html");
const outputDir = path.join(process.cwd(), "email-previews/reports");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const locales: Record<string, any> = { en: enUS, de, fr, it };
const languages = ["en", "de", "fr", "it"];

function getTranslation(messages: any, key: string) {
    const keys = key.split(".");
    let value = messages;
    for (const k of keys) {
        if (!value || value[k] === undefined) return key;
        value = value[k];
    }
    return value;
}

function generatePreview() {
    console.log("Generating report previews...");
    const template = fs.readFileSync(templatePath, "utf-8");

    for (const lang of languages) {
        const messagesPath = path.join(messagesDir, `${lang}.json`);
        const messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));

        const locale = locales[lang];
        const now = new Date();
        const periodName = format(now, 'MMMM yyyy', { locale });

        const data = {
            userName: "Demo User",
            periodName,
            introText: getTranslation(messages, "notifications.types.monthly-report.labels.introText"),
            totalIncomeLabel: getTranslation(messages, "notifications.types.monthly-report.labels.totalIncome"),
            totalExpenseLabel: getTranslation(messages, "notifications.types.monthly-report.labels.totalExpense"),
            totalIncome: "CHF 12,500.00",
            totalExpense: "CHF 8,240.50",
            viewDashboardLabel: getTranslation(messages, "notifications.types.monthly-report.labels.viewDashboard"),
            footerText: getTranslation(messages, "notifications.types.monthly-report.labels.footerText"),
            appUrl: "https://app.budgethub.ch/signin",
            hubs: [
                {
                    name: "Personal Finances",
                    spent: "CHF 4,500.00",
                    savingRate: "15.5",
                    spendingLabel: getTranslation(messages, "notifications.types.monthly-report.labels.spending"),
                    savingRateLabel: getTranslation(messages, "notifications.types.monthly-report.labels.savingRate"),
                },
                {
                    name: "Shared Household",
                    spent: "CHF 3,740.50",
                    savingRate: "8.2",
                    spendingLabel: getTranslation(messages, "notifications.types.monthly-report.labels.spending"),
                    savingRateLabel: getTranslation(messages, "notifications.types.monthly-report.labels.savingRate"),
                }
            ]
        };

        let html = template;
        html = html.replace(/{{userName}}/g, data.userName);
        html = html.replace(/{{periodName}}/g, data.periodName);
        html = html.replace(/{{introText}}/g, data.introText);
        html = html.replace(/{{totalIncomeLabel}}/g, data.totalIncomeLabel);
        html = html.replace(/{{totalExpenseLabel}}/g, data.totalExpenseLabel);
        html = html.replace(/{{totalIncome}}/g, data.totalIncome);
        html = html.replace(/{{totalExpense}}/g, data.totalExpense);
        html = html.replace(/{{viewDashboardLabel}}/g, data.viewDashboardLabel);
        html = html.replace(/{{footerText}}/g, data.footerText);
        html = html.replace(/{{appUrl}}/g, data.appUrl);

        const hubRows = data.hubs.map((hub: any) => `
            <div class="hub-section">
                <div class="hub-title">${hub.name}</div>
                <div class="budget-info">
                    <span>${hub.spendingLabel}: <strong>${hub.spent}</strong></span>
                    <span>${hub.savingRateLabel}: <strong>${hub.savingRate}%</strong></span>
                </div>
            </div>
        `).join("");

        html = html.replace(/{{#hubs}}[\s\S]*?{{\/hubs}}/g, hubRows);

        const outputPath = path.join(outputDir, `report-${lang}.html`);
        fs.writeFileSync(outputPath, html);
        console.log(`- Generated: ${outputPath}`);
    }

    console.log("\nDone! Open the files in 'email-previews/reports/' to see the templates.");
}

generatePreview();
