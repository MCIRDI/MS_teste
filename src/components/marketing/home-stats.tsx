import { getTranslations } from "next-intl/server";

import { IconChart, IconClock, IconGlobe, IconUsers } from "@/components/marketing/icons";
import { getHomeStats } from "@/lib/i18n";

const statIcons = [IconChart, IconUsers, IconGlobe, IconClock];

export async function HomeStats() {
  const t = await getTranslations();
  const publicStats = getHomeStats(t);

  return (
    <section className="px-6 py-4">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {publicStats.map((item, index) => {
          const Icon = statIcons[index] ?? IconChart;

          return (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-md"
            >
              <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 opacity-0 transition group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 tabular-nums text-3xl font-semibold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
