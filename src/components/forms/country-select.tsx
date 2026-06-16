import type { ChangeEvent } from "react";

import { countries } from "@/lib/constants";
import { isKnownCountry } from "@/lib/country-source";
import { cn } from "@/lib/utils";

export function CountrySelect({
  id,
  name = "country",
  defaultValue = "",
  value,
  onChange,
  required = false,
  className,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const safeDefault = defaultValue && isKnownCountry(defaultValue) ? defaultValue : "";
  const safeValue =
    value !== undefined ? (value && isKnownCountry(value) ? value : "") : undefined;

  const selectProps =
    safeValue !== undefined
      ? { value: safeValue, onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange?.(event.target.value) }
      : { defaultValue: safeDefault };

  return (
    <select
      id={id}
      name={name}
      required={required}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...selectProps}
    >
      <option value="" disabled>
        Select a country
      </option>
      {countries.map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
}
