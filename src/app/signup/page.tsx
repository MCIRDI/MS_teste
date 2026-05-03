import Link from "next/link";

import { SignupForm } from "@/components/forms/signup-form";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Create account</p>
          <h1 className="font-serif text-5xl text-slate-900">Join MS test as a client or tester.</h1>
          <p className="text-base leading-8 text-slate-600">
            Clients can launch campaigns and view validated defects. Testers can maintain device inventories, accept matched invitations, and submit detailed reports with evidence.
          </p>
          <p className="text-sm leading-7 text-slate-600">
            Moderator and test manager roles are intended to be assigned by admins after account approval.
          </p>
        </div>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Pick a role and complete the fields below.</CardDescription>
          </CardHeader>
          <CardSection>
            <SignupForm />
            <p className="mt-6 text-sm text-slate-600">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Login
              </Link>
            </p>
          </CardSection>
        </Card>
      </div>
    </main>
  );
}
