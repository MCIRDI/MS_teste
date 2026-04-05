import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 font-serif text-3xl text-stone-900">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
