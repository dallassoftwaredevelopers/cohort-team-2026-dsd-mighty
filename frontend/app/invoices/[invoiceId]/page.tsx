"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/Status-Badge/status-badge";
import { getBill } from "@/lib/api/bills";
import type { Bill } from "@/types/bill";

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const billId = params.id;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBill() {
      try {
        const result = await getBill(billId);

        if (!cancelled) {
          setBill(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load invoice.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBill();

    return () => {
      cancelled = true;
    };
  }, [billId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl pt-16">
        <p role="status" className="text-sm text-foreground-muted">
          Loading invoice...
        </p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 pt-16">
        <p role="alert" className="text-sm text-red-600">
          {error ?? "Invoice not found."}
        </p>

        <Link href="/invoices" className="text-sm font-medium text-primary hover:underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 pt-16">
      <Link href="/invoices" className="text-sm text-foreground-muted hover:text-foreground">
        ← Back to invoices
      </Link>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-muted">Invoice</p>
            <h1 className="text-2xl font-semibold text-foreground">{bill.invoice_number}</h1>
          </div>

          <StatusBadge status={bill.status} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-foreground-muted">Vendor</p>
            <p className="font-medium">{bill.vendor_name_raw ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-foreground-muted">Property</p>
            <p className="font-medium">{bill.property_address ?? "—"}</p>
          </div>

          <div>
            <p className="text-sm text-foreground-muted">Account number</p>
            <p className="font-medium">{bill.account_number_raw}</p>
          </div>

          <div>
            <p className="text-sm text-foreground-muted">Invoice date</p>
            <p className="font-medium">{formatDate(bill.invoice_date)}</p>
          </div>

          <div>
            <p className="text-sm text-foreground-muted">Due date</p>
            <p className="font-medium">{formatDate(bill.due_date)}</p>
          </div>

          <div>
            <p className="text-sm text-foreground-muted">Submitted by</p>
            <p className="font-medium">{bill.submitted_by.full_name}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm text-foreground-muted">Invoice amount</p>
          <p className="text-3xl font-semibold tabular-nums">
            {currency.format(Number(bill.amount))}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          {bill.description || "No description provided."}
        </p>
      </section>
    </main>
  );
}
