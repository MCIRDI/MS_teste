"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MultiSelectProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  name?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Search and select...",
  name,
}: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const unselected = filtered.filter((o) => !selected.includes(o));

  function add(value: string) {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setQuery("");
  }

  function remove(value: string) {
    onChange(selected.filter((s) => s !== value));
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="min-h-[2.5rem] w-full cursor-text rounded-lg border border-slate-300 bg-white px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map((value) => (
            <Badge key={value} className="flex items-center gap-1 pr-1">
              {value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(value);
                }}
                className="ml-0.5 rounded-full px-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                ×
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && unselected.length > 0) {
                e.preventDefault();
                add(unselected[0]);
              }
              if (e.key === "Backspace" && query === "" && selected.length > 0) {
                remove(selected[selected.length - 1]);
              }
            }}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {open && unselected.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {unselected.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                add(value);
                inputRef.current?.focus();
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {name && (
        <input type="hidden" name={name} value={selected.join(", ")} />
      )}
    </div>
  );
}
