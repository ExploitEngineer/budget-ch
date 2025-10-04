import { LangSwitcher } from "@/components/lang-switcher";
import { ModeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 px-4 py-6 dark:bg-zinc-900">
      <div className="mb-6 flex w-full max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/images/bh-logo.png"
            width={40}
            height={40}
            alt="company logo"
            className="sm:h-[50px] sm:w-[50px]"
          />
          <div className="flex items-center font-bold sm:text-lg">
            <span>budgethub</span>
            <span className="text-blue-600">.ch</span>
          </div>
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
