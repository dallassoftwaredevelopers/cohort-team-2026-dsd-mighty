import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { accountStatuses } from "@/lib/invoice-form-schema";
import { InvoiceForm } from "./invoice-form";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// The real module needs NEXT_PUBLIC_API_URL at import time and makes network
// calls; the form is tested in isolation.
jest.mock("@/lib/api/bills", () => ({
  createBill: jest.fn(),
  saveBillDraft: jest.fn(),
  validateInvoicePdf: jest.fn(),
}));

function pdf(name = "invoice.pdf", type = "application/pdf") {
  return new File(["%PDF-1.4"], name, { type });
}

function dropZone() {
  return screen.getByText("Upload / import invoice (PDF)").closest("label") as HTMLElement;
}

describe("InvoiceForm", () => {
  beforeEach(() => {
    push.mockClear();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders every field by its label", () => {
    render(<InvoiceForm />);

    [
      "Account / Customer #",
      "Statement / Bill ID",
      "Customer / Business Name",
      "Property Address",
      "Issue / Record / Invoice Date",
      "Due / Pay Date",
      "Bill Description / Explanation",
      "Prev Payments",
      "Current Due",
      "Account Status",
      "Payment / Processing Notes (optional)",
      "Website Name (optional)",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("offers an option for every account status", () => {
    render(<InvoiceForm />);

    accountStatuses.forEach((status: string) => {
      const optionName = status || "Select status";
      expect(screen.getByRole("option", { name: optionName })).toBeInTheDocument();
    });
  });

  it("shows validation errors and does not navigate when submitted empty", async () => {
    const user = userEvent.setup();
    const { container } = render(<InvoiceForm />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(container.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThan(0);
    });
    expect(push).not.toHaveBeenCalled();
  });

  describe("PDF drag and drop", () => {
    it("selects a dropped PDF and enables validation", () => {
      render(<InvoiceForm />);
      const validate = screen.getByRole("button", { name: "Validate PDF" });
      expect(validate).toBeDisabled();

      fireEvent.drop(dropZone(), { dataTransfer: { files: [pdf()] } });

      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
      expect(validate).toBeEnabled();
    });

    it("accepts a .pdf file with an empty MIME type", () => {
      render(<InvoiceForm />);

      fireEvent.drop(dropZone(), { dataTransfer: { files: [pdf("scan.PDF", "")] } });

      expect(screen.getByText("scan.PDF")).toBeInTheDocument();
    });

    it("rejects a dropped non-PDF file", () => {
      render(<InvoiceForm />);

      fireEvent.drop(dropZone(), {
        dataTransfer: { files: [new File(["x"], "photo.png", { type: "image/png" })] },
      });

      expect(screen.getByRole("alert")).toHaveTextContent("Only PDF files can be uploaded.");
      expect(screen.getByRole("button", { name: "Validate PDF" })).toBeDisabled();
    });

    it("rejects dropping more than one file", () => {
      render(<InvoiceForm />);

      fireEvent.drop(dropZone(), { dataTransfer: { files: [pdf("a.pdf"), pdf("b.pdf")] } });

      expect(screen.getByRole("alert")).toHaveTextContent("Drop one PDF at a time.");
    });

    it("highlights the zone while a file is dragged over it", () => {
      render(<InvoiceForm />);
      // Look the zone up once: its text changes while dragging.
      const zone = dropZone();

      fireEvent.dragOver(zone, { dataTransfer: { dropEffect: "none" } });
      expect(screen.getByText("Drop the PDF here")).toBeInTheDocument();

      fireEvent.dragLeave(zone, { relatedTarget: document.body });
      expect(screen.getByText("Upload / import invoice (PDF)")).toBeInTheDocument();
    });

    it("still accepts a PDF from the file picker", async () => {
      const user = userEvent.setup();
      const { container } = render(<InvoiceForm />);

      await user.upload(container.querySelector("#invoicePdf") as HTMLInputElement, pdf());

      expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    });
  });
});
