import { getTranslations } from "next-intl/server";

import { IconLayers, IconTarget, IconUsers } from "@/components/marketing/icons";
import { getHomeFeatures } from "@/lib/i18n";

const featureIcons = [IconLayers, IconUsers, IconTarget];
const featureAccents = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
];

export async function HomeFeatures() {
  const t = await getTranslations();
  const publicFeatures = getHomeFeatures(t);

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            {t("home.featuresSection.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
            {t("home.featuresSection.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t("home.featuresSection.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-12 md:grid-rows-2 md:gap-5">
          {publicFeatures.map((feature, index) => {
            const Icon = featureIcons[index] ?? IconLayers;
            const accent = featureAccents[index] ?? featureAccents[0];
            const spanClass =
              index === 0
                ? "md:col-span-7 md:row-span-2"
                : index === 1
                  ? "md:col-span-5"
                  : "md:col-span-5 md:col-start-8 md:row-start-2";

            return (
              <article
                key={feature.title}
                className={`bento-card group flex h-full flex-col p-6 md:p-7 ${spanClass}`}
              >
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg shadow-indigo-500/20 transition group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 md:text-base">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
