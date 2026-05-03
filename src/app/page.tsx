import Link from "next/link";

import { publicFeatures, publicStats } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-14">
      <section className="rounded-2xl border border-slate-200/90 bg-white px-8 py-12 shadow-[0_1px_3px_rgba(15,23,42,0.06)] md:px-12 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Human testing platform
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-5xl">
              MS test helps clients run structured crowdtesting campaigns with real people.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Launch campaigns, match eligible testers, moderate incoming defects, and deliver final validated bug reports from a single Next.js platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup">
                <Button>Create your account</Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="secondary">See the workflow</Button>
              </Link>
            </div>
          </div>
          <Card variant="highlight" padding="none">
            <CardHeader>
              <CardTitle>Real-world coverage</CardTitle>
              <CardDescription>
                Confidence comes from structured campaigns, eligible testers, and review workflows—not guesses.
              </CardDescription>
            </CardHeader>
            <CardSection className="space-y-3 border-t border-blue-100/80 bg-white/60 text-sm leading-relaxed text-slate-600">
              <p>We connect you with real people who test your website or app in everyday situations, uncovering bugs and sharing honest feedback.</p>
              <p>With their insights, you can refine your product and launch with confidence.</p>
              <p className="font-medium text-slate-700">MS Test helps you build better—together.</p>
            </CardSection>
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-4">
        {publicStats.map((item) => (
          <Card key={item.label} variant="muted" className="border-l-[3px] border-l-blue-600">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {publicFeatures.map((feature) => (
          <Card key={feature.title} padding="none">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardSection className="pt-2">
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </CardSection>
          </Card>
        ))}
      </section>
    </main>
  );
}
