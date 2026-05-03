import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Welcome back</p>
          <h1 className="font-serif text-5xl text-slate-900">Login to continue a campaign or review queue.</h1>
          <p className="text-base leading-8 text-slate-600">
            Clients, testers, moderators, test managers, and admins all use the same secure entry point with JWT session cookies and role-based dashboards.
          </p>
        </div>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter the email and password for your workspace role.</CardDescription>
          </CardHeader>
          <CardSection>
            <LoginForm />
            <p className="mt-6 text-sm text-slate-600">
              Need an account?{" "}
              <Link href="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </CardSection>
        </Card>
      </div>
    </main>
  );
}
