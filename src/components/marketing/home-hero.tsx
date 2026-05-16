import { getTranslations } from "next-intl/server";

import { IconSpark } from "@/components/marketing/icons";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export async function HomeHero() {
  const t = await getTranslations();

  return (
    <section className="relative px-6 pb-16 pt-8 md:pb-24 md:pt-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-pulse-glow absolute -top-32 start-1/3 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="animate-pulse-glow absolute bottom-0 end-0 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl [animation-delay:2s]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm backdrop-blur">
            <IconSpark className="h-3.5 w-3.5 text-indigo-600" />
            {t("home.eyebrow")}
          </div>

          <h1 className="mt-7 font-serif text-[2.75rem] font-medium leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
            <span className="text-gradient">{t("brand.name")}</span>
            <span className="mt-3 block text-slate-800">{t("home.heroHeadline")}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">{t("home.subtitle")}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                {t("home.createAccount")}
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                {t("home.seeWorkflow")}
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-8">
            {[
              { label: t("home.stats.campaigns"), value: "320+" },
              { label: t("home.stats.testers"), value: "2.4k" },
              { label: t("home.stats.countries"), value: "40" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent blur-2xl" />
          <div className="animate-float-soft relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-2 shadow-2xl shadow-blue-900/10 backdrop-blur">
            <div className="rounded-[1.35rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/90">
                    {t("home.preview.eyebrow")}
                  </p>
                  <p className="mt-1 text-base font-semibold">{t("home.preview.campaign")}</p>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase text-emerald-300 ring-1 ring-emerald-400/30">
                  {t("home.preview.live")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { label: t("home.stats.reviewTime"), value: "3h" },
                  { label: "Bugs", value: "18" },
                  { label: "Testers", value: "46" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
                  >
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2.5">
                {[
                  { severity: "Critical", title: "Checkout timeout on mobile", w: "w-[92%]" },
                  { severity: "High", title: "Coupon validation edge case", w: "w-[76%]" },
                  { severity: "Medium", title: "Safari layout shift on login", w: "w-[58%]" },
                ].map((bug) => (
                  <div
                    key={bug.title}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  >
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                        bug.severity === "Critical"
                          ? "bg-red-500/30 text-red-200"
                          : bug.severity === "High"
                            ? "bg-amber-500/30 text-amber-200"
                            : "bg-sky-500/30 text-sky-200"
                      }`}
                    >
                      {bug.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-slate-200">{bug.title}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 ${bug.w}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -start-5 rounded-2xl border border-slate-200/90 bg-white px-5 py-3.5 shadow-xl">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t("home.preview.countries")}
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900">40+</p>
          </div>
        </div>
      </div>
    </section>
  );
}
