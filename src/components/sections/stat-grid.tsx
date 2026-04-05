import { Card } from "@/components/ui/card";

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="space-y-2">
          <p className="text-sm text-stone-500">{item.label}</p>
          <p className="text-3xl font-semibold tracking-tight text-stone-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
