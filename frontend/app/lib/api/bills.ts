// Read per request, not at import: a module-level throw breaks every importer
// (including tests) whenever the variable is unset. Keep the literal
// `process.env.NEXT_PUBLIC_API_URL` so Next.js can inline it at build time.
function apiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is missing. Check .env.local");
  }
  return url;
}

export type BillStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid"
  | "failed"
  | "exception";

export type AccountStatus = "unpaid" | "outstanding" | "paid";

export type BillCreatePayload = {
  account_number_raw: string;
  vendor_name_raw?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
  prev_payments?: string;
  description?: string;
  processing_notes?: string;
  property_address?: string;
  account_status?: AccountStatus;
  website_name?: string;
};

export type Bill = {
  id: string;
  account_number_raw: string;
  vendor_name_raw: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: string;
  prev_payments: string | null;
  description: string | null;
  processing_notes: string | null;
  property_address: string | null;
  account_status: AccountStatus | null;
  website_name: string | null;
  vendor_account_id: string | null;
  submitted_by: { id: string; full_name: string };
  status: BillStatus;
  exception_reason: string | null;
  document_path: string | null;
  created_at: string;
};

export async function createBill(payload: BillCreatePayload): Promise<Bill> {
  const url = `${apiUrl()}/bills`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to reach the backend. Check your connection and try again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => null);

    throw new Error(error?.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function validateInvoicePdf(
  file: File,
): Promise<{ bill_id: string; validated_size: number }> {
  const formData = new FormData();

  formData.append("file", file);

  // Temporary ID for local validation testing only.
  // No real bill is created or modified.
  const testBillId = crypto.randomUUID();

  const response = await fetch(`${apiUrl()}/bills/${testBillId}/document`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `PDF validation failed (${response.status})`,
    );
  }

  return response.json();
}

export type BillDraftPayload = {
  account_number_raw?: string;
  invoice_number?: string;
  vendor_name_raw?: string;
  invoice_date?: string;
  due_date?: string;
  amount?: string;
  description?: string;
  processing_notes?: string;
  property_address?: string;
  account_status?: AccountStatus;
  website_name?: string;
};

export type BillDraftResponse = {
  bill_id: string;
  status: "draft";
  document_path: string | null;
};

import { createClient } from "@/lib/supabase/client";

export async function saveBillDraft(payload: BillDraftPayload): Promise<BillDraftResponse> {
  const supabase = createClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("You must be signed in to save a draft.");
  }

  const url = `${apiUrl()}/bills/drafts`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // The browser hides the real cause: backend down, CORS rejection, or an
    // unhandled 500 (FastAPI's 500 responses carry no CORS headers).
    throw new Error(
      "Unable to reach the backend. It may be down or returned a server error — check the backend logs.",
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `Unable to save draft (${response.status})`,
    );
  }

  return response.json();
}
