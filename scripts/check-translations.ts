import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LANGUAGES = ['en', 'de', 'fr', 'it'];

function flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
            flattened[newKey] = obj[key];
        }
    }

    return flattened;
}

function checkTranslations() {
    console.log('🔍 Checking translation keys across all languages...\n');

    // Load all translation files
    const translations: Record<string, Record<string, any>> = {};

    for (const lang of LANGUAGES) {
        const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            translations[lang] = flattenObject(data);
        } catch (error) {
            console.error(`❌ Error loading ${lang}.json:`, error);
            process.exit(1);
        }
    }

    // Get all unique keys from English (reference language)
    const referenceKeys = new Set(Object.keys(translations['en']));
    const allKeys = new Set<string>();

    // Collect all keys from all languages
    for (const lang of LANGUAGES) {
        Object.keys(translations[lang]).forEach(key => allKeys.add(key));
    }

    // Check for missing keys
    const issues: Record<string, string[]> = {};
    let totalIssues = 0;

    for (const lang of LANGUAGES) {
        const missingKeys: string[] = [];

        for (const key of allKeys) {
            if (!(key in translations[lang])) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            issues[lang] = missingKeys;
            totalIssues += missingKeys.length;
        }
    }

    // Check for extra keys (not in English)
    const extraKeys: Record<string, string[]> = {};
    for (const lang of LANGUAGES) {
        if (lang === 'en') continue;

        const extras: string[] = [];
        for (const key of Object.keys(translations[lang])) {
            if (!referenceKeys.has(key)) {
                extras.push(key);
            }
        }

        if (extras.length > 0) {
            extraKeys[lang] = extras;
        }
    }

    // Report results
    console.log('═'.repeat(80));
    console.log('📊 TRANSLATION ANALYSIS RESULTS');
    console.log('═'.repeat(80));
    console.log(`\nTotal keys in English (reference): ${referenceKeys.size}`);
    console.log(`Total unique keys across all languages: ${allKeys.size}\n`);

    if (totalIssues === 0 && Object.keys(extraKeys).length === 0) {
        console.log('✅ All translation files are in sync! No missing keys found.\n');
    } else {
        // Report missing keys
        if (totalIssues > 0) {
            console.log('❌ MISSING KEYS:\n');

            for (const lang of LANGUAGES) {
                if (issues[lang]) {
                    console.log(`\n🔴 ${lang.toUpperCase()} (${issues[lang].length} missing):`);
                    issues[lang].forEach(key => {
                        console.log(`   - ${key}`);
                    });
                }
            }
        }

        // Report extra keys
        if (Object.keys(extraKeys).length > 0) {
            console.log('\n\n⚠️  EXTRA KEYS (not in English):\n');

            for (const lang in extraKeys) {
                console.log(`\n🟡 ${lang.toUpperCase()} (${extraKeys[lang].length} extra):`);
                extraKeys[lang].forEach(key => {
                    console.log(`   - ${key}`);
                });
            }
        }

        console.log('\n' + '═'.repeat(80));
        console.log(`\n📈 Summary: ${totalIssues} missing keys, ${Object.values(extraKeys).flat().length} extra keys\n`);
    }

    // Exit with error code if issues found
    if (totalIssues > 0) {
        process.exit(1);
    }
}

checkTranslations();
