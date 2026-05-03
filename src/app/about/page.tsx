import { Card, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">About MS test</p>
        <h1 className="font-serif text-5xl text-slate-900">A practical crowdtesting platform for structured delivery.</h1>
        <p className="max-w-3xl text-base leading-8 text-slate-600">
          MS test was designed for teams that need human feedback without a heavy enterprise stack. Clients define campaign scope, testers work through targeted tasks, moderators maintain quality, and test managers deliver validated findings.
        </p>
      </div>
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>What the platform supports</CardTitle>
          </CardHeader>
          <CardSection>
            <p className="text-sm leading-relaxed text-slate-600">
              Multi-role access control, pricing preview, tester-device profiling, invitation-based matching, moderated bug review, analytics, and direct filesystem uploads for screenshots, videos, and logs.
            </p>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Why the architecture is simple</CardTitle>
          </CardHeader>
          <CardSection>
            <p className="text-sm leading-relaxed text-slate-600">
              Everything runs inside Next.js App Router with MySQL-compatible storage through Prisma and standard Node.js route handlers, which keeps the deployment model friendly to shared and VPS-style environments like Hostinger.
            </p>
          </CardSection>
        </Card>
      </section>
    </main>
  );
}
