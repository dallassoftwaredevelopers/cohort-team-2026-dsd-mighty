import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  extractBill,
  getBillDraft,
  saveBillDraft,
  submitBill,
  updateBillDraft,
} from "@/lib/api/bills";
import { ApiError } from "@/lib/api/http";
import { lookUpVendorAccounts } from "@/lib/api/vendor-account-lookup";
import type { Bill, BillDraftDetail } from "@/types/bill";
import type { VendorAccountOption } from "@/types/vendor-account-lookup";
import { InvoiceForm } from "./invoice-form";

const push = jest.fn();
let mockPathname = "/invoices/new";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, bfcacheId: "_b_0_" }),
  usePathname: () => mockPathname,
}));

jest.mock("@/lib/api/bills", () => ({
  extractBill: jest.fn(),
  getBillDraft: jest.fn(),
  saveBillDraft: jest.fn(),
  submitBill: jest.fn(),
  updateBillDraft: jest.fn(),
  uploadInvoicePdf: jest.fn(),
}));

jest.mock("@/lib/api/vendor-account-lookup", () => ({
  lookUpVendorAccounts: jest.fn(),
}));

const mockLookUp = lookUpVendorAccounts as jest.MockedFunction<typeof lookUpVendorAccounts>;
const mockSaveBillDraft = saveBillDraft as jest.MockedFunction<typeof saveBillDraft>;
const mockUpdateBillDraft = updateBillDraft as jest.MockedFunction<typeof updateBillDraft>;
const mockSubmitBill = submitBill as jest.MockedFunction<typeof submitBill>;
const mockGetBillDraft = getBillDraft as jest.MockedFunction<typeof getBillDraft>;
const mockExtractBill = extractBill as jest.MockedFunction<typeof extractBill>;

function account(
  id: string,
  accountNumber: string,
  vendorName: string,
  propertyName = "125 Industrial Way",
): VendorAccountOption {
  return {
    id,
    account_number: accountNumber,
    vendor_id: `vendor-${id}`,
    vendor_name: vendorName,
    property_id: "property-1",
    property_name: propertyName,
  };
}

const alder = account("acc-1", "2000456700", "Alder Creek Landscaping");
const brightwater = account("acc-2", "2000456701", "Brightwater Water & Sewer");
const brightwaterOak = account("acc-3", "2000-456701", "Brightwater Water & Sewer", "Oak Row");
const everyAccount = [alder, brightwater, brightwaterOak];

// The server's answer per account number; anything else matches nothing.
const matchesFor: Record<string, VendorAccountOption[]> = {
  "2000-456700": [alder],
  "2000456700": [alder],
  "2000456701": [brightwater, brightwaterOak],
};

const NO_MATCH = "No vendor account has this account number. Pick one, or leave it for later.";

function vendorAccount() {
  return screen.getByLabelText("Vendor account");
}

function typeAccountNumber(value: string) {
  fireEvent.change(screen.getByLabelText("Account / Customer #"), { target: { value } });
}

async function findMatched(vendorName: string) {
  return waitFor(() => {
    const field = vendorAccount();
    expect(field.tagName).toBe("OUTPUT");
    expect(field).toHaveTextContent(vendorName);
    return field;
  });
}

function optionNames(): string[] {
  return within(vendorAccount())
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

function fillInValidBill(accountNumber: string) {
  const values: Record<string, string> = {
    "Account / Customer #": accountNumber,
    "Statement / Bill ID": "INV-2001",
    "Customer / Business Name": "Alder Creek",
    "Property Address": "125 Industrial Way",
    "Issue / Record / Invoice Date": "2026-10-01",
    "Due / Pay Date": "2026-10-31",
    "Bill Description / Explanation": "Landscaping",
    "Current Due": "250.00",
  };
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}

function draft(overrides: Partial<BillDraftDetail> = {}): BillDraftDetail {
  return {
    bill_id: "bill-1",
    status: "draft",
    document_path: null,
    account_number_raw: "2000456700",
    invoice_number: "INV-2001",
    vendor_name_raw: null,
    invoice_date: null,
    due_date: null,
    amount: null,
    prev_payments: null,
    description: null,
    processing_notes: null,
    property_address: null,
    account_status: null,
    website_name: null,
    vendor_account_id: null,
    ...overrides,
  };
}

describe("InvoiceForm vendor account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/invoices/new";
    mockLookUp.mockImplementation(async (accountNumber) =>
      accountNumber === undefined ? everyAccount : (matchesFor[accountNumber] ?? []),
    );
    mockSaveBillDraft.mockResolvedValue({
      bill_id: "bill-1",
      status: "draft",
      document_path: null,
    });
    mockUpdateBillDraft.mockResolvedValue({
      bill_id: "bill-1",
      status: "draft",
      document_path: null,
    });
    mockSubmitBill.mockResolvedValue({ id: "bill-1", status: "pending_approval" } as Bill);
    mockGetBillDraft.mockReturnValue(new Promise<never>(() => {}));
    mockExtractBill.mockReturnValue(new Promise<never>(() => {}));
  });

  it("shows the one account whose number matches, looked up as the person types", async () => {
    render(<InvoiceForm />);

    typeAccountNumber("2000-456700");

    const matched = await findMatched("Alder Creek Landscaping");
    expect(matched).toHaveTextContent("2000456700 · 125 Industrial Way");
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
    expect(mockLookUp).toHaveBeenCalledWith("2000-456700", expect.any(AbortSignal));
    expect(screen.queryByText(NO_MATCH)).not.toBeInTheDocument();
  });

  it("looks up once typing pauses, not on every key", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.type(screen.getByLabelText("Account / Customer #"), "2000456700");

    await findMatched("Alder Creek Landscaping");
    const numbers = mockLookUp.mock.calls.map(([number]) => number).filter(Boolean);
    expect(numbers).toEqual(["2000456700"]);
  });

  it("offers every account when no account has the number", async () => {
    render(<InvoiceForm />);

    typeAccountNumber("9999");

    expect(await screen.findByText(NO_MATCH)).toBeInTheDocument();
    expect(vendorAccount().tagName).toBe("SELECT");
    expect(vendorAccount()).toHaveValue("");
    expect(optionNames()).toEqual([
      "Leave for later",
      "Alder Creek Landscaping · 2000456700 · 125 Industrial Way",
      "Brightwater Water & Sewer · 2000456701 · 125 Industrial Way",
      "Brightwater Water & Sewer · 2000-456701 · Oak Row",
    ]);
  });

  it("offers only the candidates when several accounts have the number", async () => {
    render(<InvoiceForm />);

    typeAccountNumber("2000456701");

    expect(
      await screen.findByText(
        "2 vendor accounts have this account number. Pick one, or leave it for later.",
      ),
    ).toBeInTheDocument();
    expect(optionNames()).toEqual([
      "Leave for later",
      "Brightwater Water & Sewer · 2000456701 · 125 Industrial Way",
      "Brightwater Water & Sewer · 2000-456701 · Oak Row",
    ]);
  });

  it("sends the picked account with Save Draft and Create", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    fillInValidBill("2000456701");
    await screen.findByText(/2 vendor accounts have this account number/);

    await user.selectOptions(vendorAccount(), "acc-3");

    const matched = await findMatched("Brightwater Water & Sewer");
    expect(matched).toHaveTextContent("Oak Row");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    await screen.findByRole("button", { name: "Draft Saved ✓" });
    expect(mockSaveBillDraft.mock.calls[0][0]).toMatchObject({ vendor_account_id: "acc-3" });

    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(mockSubmitBill).toHaveBeenCalledWith(
      "bill-1",
      expect.objectContaining({ vendor_account_id: "acc-3" }),
    );
  });

  it("leaves a matched or unpicked account to the server", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    fillInValidBill("2000456700");
    await findMatched("Alder Creek Landscaping");

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(mockSaveBillDraft.mock.calls[0][0].vendor_account_id).toBeNull();
    expect(mockSubmitBill.mock.calls[0][1].vendor_account_id).toBeUndefined();
  });

  it("changes a matched account to another one", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    typeAccountNumber("2000456700");
    await findMatched("Alder Creek Landscaping");

    await user.click(screen.getByRole("button", { name: "Change" }));

    // Every account is offered, the match selected, and no empty choice: the
    // server would match the number again.
    expect(vendorAccount()).toHaveValue("acc-1");
    expect(vendorAccount()).toHaveFocus();
    expect(optionNames()).toHaveLength(3);
    await user.selectOptions(vendorAccount(), "acc-2");

    await findMatched("Brightwater Water & Sewer");
    expect(screen.getByRole("button", { name: "Change" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    await screen.findByRole("button", { name: "Draft Saved ✓" });
    expect(mockSaveBillDraft.mock.calls[0][0]).toMatchObject({ vendor_account_id: "acc-2" });
  });

  it("keeps the match when the person keeps the current account", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    typeAccountNumber("2000456700");
    await findMatched("Alder Creek Landscaping");

    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.click(screen.getByRole("button", { name: "Keep current" }));

    await findMatched("Alder Creek Landscaping");
  });

  it("drops the pick when the account number changes", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    typeAccountNumber("9999");
    await screen.findByText(NO_MATCH);
    await user.selectOptions(vendorAccount(), "acc-2");
    await findMatched("Brightwater Water & Sewer");

    typeAccountNumber("2000456700");

    await findMatched("Alder Creek Landscaping");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    await screen.findByRole("button", { name: "Draft Saved ✓" });
    expect(mockSaveBillDraft.mock.calls[0][0].vendor_account_id).toBeNull();
  });

  it("looks up the account number a PDF fills in", async () => {
    const nothing = { value: null, evidence: "", confidence: "high" as const };
    mockExtractBill.mockResolvedValue({
      status: "ready_for_review",
      extraction: {
        document_type: "invoice",
        vendor_name: nothing,
        account_number: { value: "2000456700", evidence: "2000456700", confidence: "high" },
        invoice_number: nothing,
        invoice_date: nothing,
        due_date: nothing,
        amount_due: nothing,
        previous_balance: nothing,
        payments_received: nothing,
        current_charges: nothing,
        line_items: [],
        service_address: nothing,
        service_period_start: nothing,
        service_period_end: nothing,
        description: nothing,
        payment_website: nothing,
        account_status: nothing,
      },
      issues: [],
      failed_reason: null,
      model: "test-model",
      prompt_version: "v1",
      file_sha256: "abc",
      input_tokens: 1,
      output_tokens: 1,
      cost_usd: 0,
      latency_ms: 1,
    });
    const { container } = render(<InvoiceForm />);

    fireEvent.change(container.querySelector("#invoicePdf") as HTMLInputElement, {
      target: { files: [new File(["%PDF-1.4"], "bill.pdf", { type: "application/pdf" })] },
    });

    await findMatched("Alder Creek Landscaping");
    expect(screen.getByLabelText("Account / Customer #")).toHaveValue("2000456700");
  });

  it("reopens a draft with its saved account", async () => {
    mockPathname = "/invoices/bill-1/edit";
    // Saved with an account picked by hand: its number matches nothing.
    mockGetBillDraft.mockResolvedValue(
      draft({ account_number_raw: "9999", vendor_account_id: "acc-2" }),
    );

    render(<InvoiceForm />);

    const matched = await findMatched("Brightwater Water & Sewer");
    expect(matched).toHaveTextContent("2000456701 · 125 Industrial Way");
  });

  it("never takes a duplicate invoice 409 for its own earlier submit", async () => {
    const user = userEvent.setup();
    const duplicate = "This invoice number is already in the system for this vendor account.";
    // The first submit gets no answer; the retry finds the invoice taken, so
    // the bill was not sent and Create must not report success.
    mockSubmitBill
      .mockRejectedValueOnce(new Error("Unable to reach the server."))
      .mockRejectedValueOnce(new ApiError(duplicate, 409));
    render(<InvoiceForm />);
    fillInValidBill("2000456700");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByRole("button", { name: "Retry Create" });

    await user.click(screen.getByRole("button", { name: "Retry Create" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(duplicate));
    expect(push).not.toHaveBeenCalled();
  });
});
