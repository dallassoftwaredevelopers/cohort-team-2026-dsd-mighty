"use client";

import { useEffect, useId } from "react";

const COPY = {
  cancel: "Cancel",
  closeDialog: "Close dialog",
};

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label={COPY.closeDialog}
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl"
      >
        <h2 id={titleId} className="mb-3 text-xl font-semibold text-foreground">
          {title}
        </h2>
        <div className="mb-6 text-sm text-foreground-muted">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-border bg-surface px-5 py-2 text-sm text-foreground hover:bg-surface-muted"
          >
            {COPY.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
