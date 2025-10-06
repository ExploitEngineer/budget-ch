import { Button } from "./ui/button";
import { useTranslations } from "next-intl";
import { LangSwitcher } from "./lang-switcher";
import Link from "next/link";

export default function Greeting() {
  const t = useTranslations("greeting");

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <LangSwitcher />
      <Button className="" asChild>
        <Link href="/me/dashboard">{t("cta")}</Link>
      </Button>

      <Link href="/signup">
        <Button className="cursor-pointer">Signup</Button>
      </Link>
      <Link href="/signin">
        <Button className="cursor-pointer">Signin</Button>
      </Link>
      <Link href="/forgot-password">
        <Button className="cursor-pointer">Forgot Password</Button>
      </Link>
    </div>
  );
}
