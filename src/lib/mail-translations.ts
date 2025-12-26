import fs from "fs";
import path from "path";

/**
 * A lightweight server-side translation helper for emails and background tasks.
 * Avoids dependency on next-intl's request-lifecycle components.
 */
export async function getMailTranslations(locale: string = "en") {
    const supportedLocales = ["en", "de", "fr", "it"];
    const targetLocale = supportedLocales.includes(locale) ? locale : "en";

    const filePath = path.join(process.cwd(), "messages", `${targetLocale}.json`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const messages = JSON.parse(fileContent);

    return (key: string, variables?: Record<string, any>) => {
        const keys = key.split(".");
        let value = messages;

        for (const k of keys) {
            if (!value || value[k] === undefined) {
                console.warn(`Translation key not found: ${key} for locale: ${targetLocale}`);
                return key;
            }
            value = value[k];
        }

        if (typeof value !== "string") {
            return key;
        }

        // Basic variable interpolation (e.g., {name})
        let result = value;
        if (variables) {
            Object.entries(variables).forEach(([vKey, vValue]) => {
                result = result.replace(new RegExp(`{${vKey}}`, "g"), String(vValue));
            });
        }

        return result;
    };
}
