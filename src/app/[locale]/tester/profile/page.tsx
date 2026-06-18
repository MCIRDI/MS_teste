import { getCountrySourceBadgeClass, getCountrySourceLabel, codeToCountryName } from "@/lib/country-source";
import { requireSession } from "@/lib/auth";
import { getTesterProfileData } from "@/lib/dashboard-data";
import { requestWithdrawalAction } from "@/app/actions/payments";
import { Card, CardDescription, CardHeader, CardMeta, CardMetaItem, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { UpdateTesterInfoButton } from "@/components/forms/update-tester-info-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function TesterProfilePage() {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);
  const { tester, withdrawnTotal, availableBalance } = await getTesterProfileData(session.id);

  const device = tester.devices[0] ?? null;
  const browser =
    device && Array.isArray(device.browsers) ? String(device.browsers[0] ?? "") : "";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Profile"
        title="Tester profile"
        description="Your testing info is used for campaign matching and is attached to every bug report you submit."
        action={
          <UpdateTesterInfoButton
            defaults={{
              country: tester.country ?? "",
              deviceName: device?.deviceName ?? "",
              osVersion: device?.osVersion ?? "",
              browser,
              screenResolution: device?.screenResolution ?? "",
            }}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Identity and tester classification</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <CardMeta className="sm:grid-cols-1">
              <CardMetaItem label="Name">{tester.name}</CardMetaItem>
              <CardMetaItem label="Email">{tester.email}</CardMetaItem>
              <CardMetaItem label="Country">
                <span>{tester.country ? codeToCountryName(tester.country) : "Not set"}</span>
                {tester.country && tester.countrySource ? (
                  <span
                    className={`ml-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${getCountrySourceBadgeClass(tester.countrySource)}`}
                  >
                    {getCountrySourceLabel(tester.countrySource)}
                  </span>
                ) : null}
              </CardMetaItem>
              <CardMetaItem label="Certification">{tester.isCertified ? "Certified" : "Crowd tester"}</CardMetaItem>
              <CardMetaItem label="Total earned">{tester.totalEarned} {tester.currency}</CardMetaItem>
              <CardMetaItem label="Withdrawn">{withdrawnTotal} {tester.currency}</CardMetaItem>
              <CardMetaItem label="Available balance">{availableBalance} {tester.currency}</CardMetaItem>
              <CardMetaItem label="Score">{tester.score}</CardMetaItem>
            </CardMeta>
          </CardSection>
        </Card>
        <Card padding="none">
          <CardHeader>
            <CardTitle>Current device</CardTitle>
            <CardDescription>Used for environment blocks on bug reports</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            {device ? (
              <CardMeta className="sm:grid-cols-1">
                <CardMetaItem label="Device">{device.deviceName}</CardMetaItem>
                <CardMetaItem label="OS">{device.osVersion}</CardMetaItem>
                <CardMetaItem label="Browser">{browser || "Not set"}</CardMetaItem>
                <CardMetaItem label="Resolution">{device.screenResolution}</CardMetaItem>
              </CardMeta>
            ) : (
              <p className="text-sm text-slate-600">No device info yet. Use &quot;Edit testing info&quot;.</p>
            )}
          </CardSection>
        </Card>
      </div>

      <Card padding="none">
        <CardHeader>
          <CardTitle>Withdraw earnings</CardTitle>
          <CardDescription>Request a payout from your available balance.</CardDescription>
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          {availableBalance > 0 ? (
            <form action={requestWithdrawalAction} className="flex max-w-md flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="amount">
                  Amount ({tester.currency})
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  max={availableBalance}
                  defaultValue={availableBalance}
                  required
                />
              </div>
              <Button type="submit">Request withdrawal</Button>
            </form>
          ) : (
            <p className="text-sm text-slate-600">No balance available for withdrawal yet.</p>
          )}
        </CardSection>
      </Card>

      {tester.payments.length > 0 ? (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Withdrawal history</CardTitle>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <ul className="space-y-2 text-sm text-slate-700">
              {tester.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span>{payment.amount} {payment.currency}</span>
                  <span className="text-xs uppercase text-slate-500">{payment.status}</span>
                </li>
              ))}
            </ul>
          </CardSection>
        </Card>
      ) : null}
    </div>
  );
}
