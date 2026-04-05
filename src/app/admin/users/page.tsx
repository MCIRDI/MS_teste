import { adminSnapshot } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/sections/section-heading";
import { StatGrid } from "@/components/sections/stat-grid";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <StatGrid items={adminSnapshot.stats} />
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Users"
          title="Account management"
          description="Admins approve or suspend accounts and can elevate users into moderator or test manager roles."
        />
        <div className="overflow-hidden rounded-3xl border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Country</th>
              </tr>
            </thead>
            <tbody>
              {adminSnapshot.users.map((user) => (
                <tr key={user.name} className="border-t border-stone-200">
                  <td className="px-4 py-4 text-stone-900">{user.name}</td>
                  <td className="px-4 py-4 text-stone-600">{user.role}</td>
                  <td className="px-4 py-4 text-stone-600">{user.status}</td>
                  <td className="px-4 py-4 text-stone-600">{user.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
