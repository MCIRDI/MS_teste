import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export async function HomeWorkflow() {
  const t = await getTranslations("howItWorks");
  const steps = t.raw("steps") as string[];

  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-sm backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium text-slate-900 md:text-3xl">
            {t("title")}
          </h2>

          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <li
                key={step}
                className="relative rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 md:text-sm">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 text-center">
            <Link
              href="/how-it-works"
              className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              {t("eyebrow")} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
