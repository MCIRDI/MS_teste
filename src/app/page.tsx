import Link from "next/link";

import { publicFeatures, publicStats } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="rounded-[40px] border border-stone-200 bg-white px-8 py-12 shadow-[0_8px_30px_rgba(28,25,23,0.04)] md:px-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-stone-500">
              Human testing platform
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-stone-900 md:text-6xl">
              MS test helps clients run structured crowdtesting campaigns with real people.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600">
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
          <Card className="grid gap-5 bg-stone-50">
            <div>
              <p className="text-sm text-stone-500">Built for Hostinger deployment</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">Next.js + MySQL + local uploads</p>
            </div>
            <div className="space-y-3 text-sm leading-7 text-stone-600">
              <p>Files are stored directly on the server filesystem inside structured upload folders.</p>
              <p>Authentication uses JWT cookies and role-based access across five actor types.</p>
              <p>Campaigns move through draft, approval, testing, review, and final delivery stages.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {publicStats.map((item) => (
          <Card key={item.label} className="space-y-2">
            <p className="text-sm text-stone-500">{item.label}</p>
            <p className="text-3xl font-semibold tracking-tight text-stone-900">{item.value}</p>
          </Card>
        ))}
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {publicFeatures.map((feature) => (
          <Card key={feature.title} className="space-y-4">
            <h2 className="font-serif text-3xl text-stone-900">{feature.title}</h2>
            <p className="text-sm leading-7 text-stone-600">{feature.description}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
