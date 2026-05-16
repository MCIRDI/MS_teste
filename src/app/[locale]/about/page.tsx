import { getTranslations } from "next-intl/server";

import { Card, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{t("eyebrow")}</p>
        <h1 className="font-serif text-5xl text-slate-900">{t("title")}</h1>
        <p className="max-w-3xl text-base leading-8 text-slate-600">{t("intro")}</p>
      </div>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t("supportsTitle")}</CardTitle>
          </CardHeader>
          <CardSection>
            <p className="text-sm leading-relaxed text-slate-600">{t("supportsBody")}</p>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t("architectureTitle")}</CardTitle>
          </CardHeader>
          <CardSection>
            <p className="text-sm leading-relaxed text-slate-600">{t("architectureBody")}</p>
          </CardSection>
        </Card>
      </section>
    </main>
  );
}
