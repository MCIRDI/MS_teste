import { getTranslations } from "next-intl/server";

import { Card, CardSection } from "@/components/ui/card";

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks");
  const steps = t.raw("steps") as string[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{t("eyebrow")}</p>
        <h1 className="font-serif text-5xl text-slate-900">{t("title")}</h1>
      </div>
      <section className="mt-10 grid gap-3">
        {steps.map((step, index) => (
          <Card key={step} padding="none">
            <CardSection className="flex gap-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <p className="pt-1 text-sm leading-relaxed text-slate-700">{step}</p>
            </CardSection>
          </Card>
        ))}
      </section>
    </main>
  );
}
