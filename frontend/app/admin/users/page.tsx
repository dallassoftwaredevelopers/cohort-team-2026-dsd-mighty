"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { getAppUsers } from "@/lib/api/users";
import { type RuleErrors, validateRules } from "@/lib/validation";
import type { Profile } from "@/types/user";

const COPY = {
  sectionTitle: "All Users",
  invoiceMaximum: "Invoice Maximum",
  invoiceMaximumTooltip: "The largest invoice that does not need admin intervention.",
  minApprovals: "Minimum Approvals Needed",
  minApprovalsTooltip: "How many approvals an invoice needs before it is approved.",
  save: "Save",
  saved: "Rules saved.",
  confirmTitle: "Save approval rules?",
  confirmLabel: "Save changes",
  confirmIntro: "This changes how invoices get approved for your company:",
  summaryInvoiceMax: "Invoice maximum",
  summaryMinApprovals: "Minimum approvals",
  invoiceMaximumHint: "Numbers only, up to 2 decimal places (e.g. 5000.50).",
  minApprovalsHint: "Whole numbers only. Must be at least 1.",
};

export default function AdminUsersPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<RuleErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      try {
        const result = await getAppUsers();

        if (!cancelled) {
          setUsers(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load users.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirm = () => {
    setConfirmOpen(false);
    setMessage(COPY.saved);
  };

  console.log("users", users);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-6 inline-block rounded bg-surface-muted px-3 py-1 text-xl font-medium text-foreground">
          {COPY.sectionTitle}
        </h2>
      </section>

      <div className="flex items-center justify-end gap-4">
        {message && <span className="text-sm text-success">{message}</span>}
      </div>
    </div>
  );
}
