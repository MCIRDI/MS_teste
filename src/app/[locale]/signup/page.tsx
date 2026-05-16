import { getTranslations } from "next-intl/server";

import { SignupForm } from "@/components/forms/signup-form";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export default async function SignupPage() {
  const t = await getTranslations("signup");

  return (
    <main className="mx-auto flex w-full max-w-6xl items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{t("eyebrow")}</p>
          <h1 className="font-serif text-5xl text-slate-900">{t("title")}</h1>
          <p className="text-base leading-8 text-slate-600">{t("subtitle")}</p>
          <p className="text-sm leading-7 text-slate-600">{t("note")}</p>
        </div>
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardSection>
            <SignupForm />
            <p className="mt-6 text-sm text-slate-600">
              {t("alreadyRegistered")}{" "}
              <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                {t("login")}
              </Link>
            </p>
          </CardSection>
        </Card>
      </div>
    </main>
  );
}
