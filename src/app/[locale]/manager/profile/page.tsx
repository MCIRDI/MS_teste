import { requireSession } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { UpdateProfileForm } from "@/components/forms/update-profile-form";

export default async function ManagerProfilePage() {
  const session = await requireSession(["TEST_MANAGER"]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Account"
        title="Your profile"
        description="Update your display name or change your password."
      />

      <Card padding="none" className="max-w-lg">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>{session.email}</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          <UpdateProfileForm name={session.name} />
        </CardSection>
      </Card>
    </div>
  );
}
