import { LangSwitcher } from "@/components/lang-switcher";
import { ModeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect logged-in users to dashboard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/me/dashboard");
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F6F8FF] px-4 dark:[background:var(--fancy-gradient)]">
      <div className="mb-6 flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/images/logo.png"
            width={150}
            height={150}
            alt="company logo"
            priority
            className="dark:hidden"
          />
          <Image
            src="/assets/images/dark-logo.png"
            width={150}
            height={150}
            alt="company logo"
            priority
            className="hidden dark:block"
          />
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <LangSwitcher />
        </div>
      </div>

      <div className="flex w-full max-w-lg items-center justify-center">
        {children}
      </div>
    </main>
  );
}
