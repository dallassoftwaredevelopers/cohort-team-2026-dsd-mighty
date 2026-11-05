"use client";

import { useState } from "react";

const COPY = {
  tooltipIcon: "?",
  edit: "edit",
  done: "done",
};

type Props = {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  prefix?: string;
  inputMode?: "decimal" | "numeric";
};

export default function RuleField({
  label,
  tooltip,
  value,
  onChange,
  error,
  prefix,
  inputMode = "decimal",
}: Props) {
  const [editing, setEditing] = useState(false);
  const id = label.toLowerCase().replace(/\s+/g, " -");

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
        <label htmlFor={id}>{label}</label>
        <span
          title={tooltip}
          className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-border text-xs text-foreground-muted"
        >
          {COPY.tooltipIcon}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div
          className={`flex w-full max-w-sm items-center rounded border-2 px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-ring ${
            error ? "border-overdue" : "border-border"
          } ${editing ? "bg-surface" : "bg-surface-muted"}`}
        >
          {prefix && <span className="mr-1 text-foreground-muted">{prefix}</span>}
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            value={value}
            disabled={!editing}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className="w-full bg-transparent text-foreground outline-none disabled:text-foreground-muted"
          />
        </div>

        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="text-sm text-primary hover:text-primary-hover hover:underline"
        >
          {editing ? COPY.done : COPY.edit}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-overdue">
          {error}
        </p>
      )}
    </div>
  );
}
