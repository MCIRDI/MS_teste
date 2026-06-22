import { getCountrySourceBadgeClass, getCountrySourceLabel, codeToCountryName } from "@/lib/country-source";
import { requireSession } from "@/lib/auth";
import { getTesterProfileData } from "@/lib/dashboard-data";
import { requestWithdrawalAction } from "@/app/actions/payments";
import { Card, CardDescription, CardHeader, CardMeta, CardMetaItem, CardSection, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { UpdateTesterInfoButton } from "@/components/forms/update-tester-info-button";
import { AddDeviceButton } from "@/components/forms/add-device-button";
import { DeleteDeviceButton } from "@/components/forms/delete-device-button";
import { UpdateProfileForm } from "@/components/forms/update-profile-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function TesterProfilePage() {
  const session = await requireSession(["TESTER", "CERT_TESTER"]);
  const { tester, withdrawnTotal, availableBalance } = await getTesterProfileData(session.id);

  const primaryDevice = tester.devices[0] ?? null;
  const primaryBrowser =
    primaryDevice && Array.isArray(primaryDevice.browsers)
      ? String(primaryDevice.browsers[0] ?? "")
      : "";

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
              deviceName: primaryDevice?.deviceName ?? "",
              osVersion: primaryDevice?.osVersion ?? "",
              browser: primaryBrowser,
              screenResolution: primaryDevice?.screenResolution ?? "",
            }}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Account card */}
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

        {/* Update account card */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>Update account</CardTitle>
            <CardDescription>Change your display name or password</CardDescription>
          </CardHeader>
          <CardSection className="border-t border-slate-100/90">
            <UpdateProfileForm name={tester.name} />
          </CardSection>
        </Card>
      </div>

      {/* Devices section */}
      <Card padding="none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Devices</CardTitle>
            <CardDescription>All your registered test environments</CardDescription>
          </div>
          <AddDeviceButton />
        </CardHeader>
        <CardSection className="border-t border-slate-100/90">
          {tester.devices.length > 0 ? (
            <ul className="space-y-3">
              {tester.devices.map((device) => {
                const browser =
                  Array.isArray(device.browsers) ? String(device.browsers[0] ?? "") : "";
                return (
                  <li
                    key={device.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                  >
                    <div className="grid gap-y-0.5 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{device.deviceName}</span>
                      <span className="text-xs text-slate-500">OS: {device.osVersion}</span>
                      {browser ? (
                        <span className="text-xs text-slate-500">Browser: {browser}</span>
                      ) : null}
                      <span className="text-xs text-slate-500">Screen: {device.screenResolution}</span>
                      {device.operator ? (
                        <span className="text-xs text-slate-500">Operator: {device.operator}</span>
                      ) : null}
                      {device.connectionType ? (
                        <span className="text-xs text-slate-500">Connection: {device.connectionType}</span>
                      ) : null}
                    </div>
                    <DeleteDeviceButton deviceId={device.id} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">
              No devices yet. Use &quot;Edit testing info&quot; or &quot;Add device&quot; to add one.
            </p>
          )}
        </CardSection>
      </Card>

      {/* Withdrawal */}
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
