import { type BillCreatePayload, createBill, withPdfType } from "./bills";

const payload: BillCreatePayload = {
  account_number_raw: "ACC-123",
  invoice_number: "INV-001",
  invoice_date: "2026-10-01",
  due_date: "2026-10-31",
  amount: "125.50",
};

const savedBill = {
  id: "abc-123",
  ...payload,
  vendor_name_raw: null,
  prev_payments: null,
  description: null,
  processing_notes: null,
  vendor_account_id: null,
  submitted_by: { id: "user-1", full_name: "Demo User" },
  status: "draft",
  exception_reason: null,
  document_path: null,
  created_at: "2026-10-27T12:00:00Z",
};

describe("createBill", () => {
  const fetchMock = jest.fn();

  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  });

  it("POSTs the payload to /bills and returs successful", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => savedBill,
    });
    const result = await createBill(payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/bills");
    expect(result).toEqual(savedBill);
  });
  it("throws the server detail message on an HTTP Error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Bill not found." }),
    });
    await expect(createBill(payload)).rejects.toThrow("Bill not found.");
  });

  it("reports a missing API URL instead of a network error", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    await expect(createBill(payload)).rejects.toThrow("NEXT_PUBLIC_API_URL is missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("withPdfType", () => {
  it("gives a dropped file with an empty MIME type the PDF type", () => {
    const dropped = new File(["%PDF-1.4"], "scan.pdf", { type: "" });

    const sent = withPdfType(dropped);

    expect(sent.type).toBe("application/pdf");
    expect(sent.name).toBe("scan.pdf");
    expect(sent.size).toBe(dropped.size);
  });

  it("leaves a file that already has a type unchanged", () => {
    const file = new File(["%PDF-1.4"], "bill.pdf", { type: "application/pdf" });

    expect(withPdfType(file)).toBe(file);
  });
});
