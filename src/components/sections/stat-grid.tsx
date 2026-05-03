import { Card } from "@/components/ui/card";

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          variant="muted"
          className="border-l-[3px] border-l-blue-600"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-2 tabular-nums text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
