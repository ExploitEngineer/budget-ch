// app/actions.ts
"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sets the 'locale' cookie and redirects the user to the current path.
 * @param formData - The form data, expecting a 'locale' field.
 */
export async function setLanguage(formData: FormData) {
  // 1. Get the desired locale from the form data
  const locale = formData.get("locale");
  const pathnameFromForm = formData.get("pathname");
  const headersList = await headers();
  const referer = headersList.get("referer");

  const supportedLocales = ["en", "fr", "de", "it"];

  // Basic validation and type checking
  if (typeof locale !== "string" || !supportedLocales.includes(locale)) {
    throw new Error("Invalid locale provided.");
  }

  let redirectTo = "/"; // Default to home page

  // Prioritize pathname from formData if provided
  if (typeof pathnameFromForm === "string" && pathnameFromForm) {
    redirectTo = pathnameFromForm;
  } else if (referer) {
    try {
      // Create a URL object from the referer string
      const url = new URL(referer);
      // The 'pathname' property gives us the path (e.g., /about/us)
      redirectTo = url.pathname;

      // OPTIONAL: Append the search params (e.g., ?query=term) if needed
      if (url.search) {
        redirectTo += url.search;
      }
    } catch (e) {
      // Handle potential errors if referer is not a valid URL
      console.error("Failed to parse referer URL:", e);
    }
  }

  // 2. Set the 'locale' cookie
  const store = await cookies();
  store.set("locale", locale, {
    // You may want to set other options like 'path', 'maxAge', etc.
    // For simplicity, a session cookie is used here.
  });

  // 3. Redirect to the current path to force a reload and apply the new locale
  redirect(redirectTo);
}
