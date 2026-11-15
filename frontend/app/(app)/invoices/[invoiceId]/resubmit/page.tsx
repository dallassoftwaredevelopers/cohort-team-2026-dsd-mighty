"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { InvoiceForm } from "@/components/Invoice-form/invoice-form";
import { getBill } from "@/lib/api/bills";
import type { Bill } from "@/types/bill";

export default function ResubmitInvoicePage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBill() {
      try {
        const result = await getBill(invoiceId);

        if (cancelled) return;

        if (result.status !== "rejected") {
          setError("Only rejected invoices can be resubmitted.");
          return;
        }

        setBill(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load invoice.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBill();

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (loading) return <p className="pt-16">Loading invoice...</p>;

  if (error || !bill) {
    return (
      <p role="alert" className="pt-16 text-red-600">
        {error ?? "Invoice not found."}
      </p>
    );
  }

  return <InvoiceForm isResubmission initialValues={bill} invoiceId={invoiceId} />;
}
