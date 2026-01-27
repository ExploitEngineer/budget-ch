import fs from "fs";
import path from "path";
import IntlMessageFormat from "intl-messageformat";

const SUPPORTED_LOCALES = ["en", "de", "fr", "it"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// HTML tag handlers for ICU rich text formatting
// These allow using <strong>, <em>, etc. in translation strings
const HTML_TAG_HANDLERS: Record<string, (chunks: string[]) => string> = {
    strong: (chunks) => `<strong>${chunks.join("")}</strong>`,
    b: (chunks) => `<b>${chunks.join("")}</b>`,
    em: (chunks) => `<em>${chunks.join("")}</em>`,
    i: (chunks) => `<i>${chunks.join("")}</i>`,
    u: (chunks) => `<u>${chunks.join("")}</u>`,
    br: () => `<br/>`,
    p: (chunks) => `<p>${chunks.join("")}</p>`,
    span: (chunks) => `<span>${chunks.join("")}</span>`,
};

/**
 * A server-side translation helper for emails and background tasks.
 * Supports ICU message format including pluralization, select, and number formatting.
 * Avoids dependency on next-intl's request-lifecycle components.
 */
export async function getMailTranslations(locale: string = "en") {
    const targetLocale: SupportedLocale = SUPPORTED_LOCALES.includes(
        locale as SupportedLocale,
    )
        ? (locale as SupportedLocale)
        : "en";

    const filePath = path.join(process.cwd(), "messages", `${targetLocale}.json`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const messages = JSON.parse(fileContent);

    return (key: string, variables?: Record<string, unknown>) => {
        const keys = key.split(".");
        let value: unknown = messages;

        for (const k of keys) {
            if (
                !value ||
                typeof value !== "object" ||
                (value as Record<string, unknown>)[k] === undefined
            ) {
                console.warn(
                    `Translation key not found: ${key} for locale: ${targetLocale}`,
                );
                return key;
            }
            value = (value as Record<string, unknown>)[k];
        }

        if (typeof value !== "string") {
            return key;
        }

        // Use IntlMessageFormat to handle ICU message format
        // (pluralization, select, number formatting, etc.)
        try {
            const formatter = new IntlMessageFormat(value, targetLocale);
            // Merge HTML tag handlers with user-provided variables
            const formatValues = { ...HTML_TAG_HANDLERS, ...variables };
            const result = formatter.format(formatValues);
            // Result can be string or array of parts, join if array
            return Array.isArray(result) ? result.join("") : String(result);
        } catch (err) {
            console.error(
                `Error formatting translation key: ${key} for locale: ${targetLocale}`,
                err,
            );
            return value;
        }
    };
}
