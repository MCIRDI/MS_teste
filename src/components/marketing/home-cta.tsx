import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export async function HomeCta() {
  const t = await getTranslations("home.cta");

  return (
    <section className="px-6 pb-20 pt-4 md:pb-28">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-12 text-center shadow-2xl md:px-16 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(99,102,241,0.4), transparent 50%), radial-gradient(circle at 80% 50%, rgba(14,165,233,0.3), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="min-w-[180px] bg-white text-slate-900 hover:bg-slate-100">
                  {t("primary")}
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-w-[180px] border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  {t("secondary")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
