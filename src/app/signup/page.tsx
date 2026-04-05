import Link from "next/link";

import { SignupForm } from "@/components/forms/signup-form";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 pt-4">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-500">Create account</p>
          <h1 className="font-serif text-5xl text-stone-900">Join MS test as a client or tester.</h1>
          <p className="text-base leading-8 text-stone-600">
            Clients can launch campaigns and view validated defects. Testers can maintain device inventories, accept matched invitations, and submit detailed reports with evidence.
          </p>
          <p className="text-sm leading-7 text-stone-600">
            Moderator and test manager roles are intended to be assigned by admins after account approval.
          </p>
        </div>
        <Card className="p-8">
          <SignupForm />
          <p className="mt-6 text-sm text-stone-600">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-stone-900">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
