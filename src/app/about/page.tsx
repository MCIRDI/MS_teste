import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.22em] text-stone-500">About MS test</p>
        <h1 className="font-serif text-5xl text-stone-900">A practical crowdtesting platform for structured delivery.</h1>
        <p className="max-w-3xl text-base leading-8 text-stone-600">
          MS test was designed for teams that need human feedback without a heavy enterprise stack. Clients define campaign scope, testers work through targeted tasks, moderators maintain quality, and test managers deliver validated findings.
        </p>
      </div>
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">What the platform supports</h2>
          <p className="text-sm leading-7 text-stone-600">
            Multi-role access control, pricing preview, tester-device profiling, invitation-based matching, moderated bug review, analytics, and direct filesystem uploads for screenshots, videos, and logs.
          </p>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-serif text-3xl text-stone-900">Why the architecture is simple</h2>
          <p className="text-sm leading-7 text-stone-600">
            Everything runs inside Next.js App Router with MySQL-compatible storage through Prisma and standard Node.js route handlers, which keeps the deployment model friendly to shared and VPS-style environments like Hostinger.
          </p>
        </Card>
      </section>
    </main>
  );
}
