"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import { FormField, inputClass } from "@/components/Form-field/form-field";
import type { BillCreatePayload } from "@/lib/api/bills";
import { createBill, validateInvoicePdf } from "@/lib/api/bills";
import {
  accountStatuses,
  emptyInvoiceForm,
  type InvoiceFormValues,
  invoiceFormSchema,
} from "@/lib/invoice-form-schema";

export function InvoiceForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const {
    register,
    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyInvoiceForm,
  });

  async function onSubmit(values: InvoiceFormValues) {
    setSubmitError("");

    const payload: BillCreatePayload = {
      account_number_raw: values.accountNumber.trim(),
      invoice_number: values.statementId.trim(),
      vendor_name_raw: values.companyName.trim() || undefined,
      invoice_date: values.issueDate,
      due_date: values.dueDate,
      amount: values.currentDue.trim(),
      prev_payments: values.previousPayments.trim() || undefined,
      description: values.description.trim() || undefined,
      processing_notes: values.notes.trim() || undefined,
      property_address: values.propertyAddress,
      account_status: values.accountStatus || undefined,
      website_name: values.websiteName || undefined,
    };

    try {
      await createBill(payload);

      router.push("/dashboard");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to create the bill. Please try again.",
      );
    }
  }

  async function handleValidatePdf() {
    if (!selectedFile) return;

    setIsValidating(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const result = await validateInvoicePdf(selectedFile);

      setUploadMessage(`PDF validated by backend (${result.validated_size} bytes). Not saved yet.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to validate PDF.");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-3xl space-y-6">
      {submitError && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {submitError}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">New Invoice</h1>

        <div className="flex items-center gap-3">
          <Button label="Save" type="button" />
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            type="button"
          />
        </div>
      </div>

      <section className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
        <FileUp className="mx-auto h-6 w-6 text-foreground-muted" />

        <p className="mt-2 text-sm font-medium">Upload / import invoice (PDF)</p>

        <input
          type="file"
          accept=".pdf,application/pdf"
          className="mt-4 block w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;

            setSelectedFile(file);
            setUploadMessage("");
            setUploadError("");
          }}
        />

        <button
          type="button"
          onClick={handleValidatePdf}
          disabled={!selectedFile || isValidating}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isValidating ? "Validating..." : "Test PDF Validation"}
        </button>

        {uploadMessage && (
          <p role="status" className="mt-3 text-sm text-green-700">
            {uploadMessage}
          </p>
        )}

        {uploadError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {uploadError}
          </p>
        )}
      </section>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <legend className="px-2 text-sm font-semibold text-foreground">General bill info</legend>

        <FormField
          label="Account / Customer #"
          htmlFor="accountNumber"
          error={errors.accountNumber?.message}
        >
          {(field) => <input {...field} {...register("accountNumber")} className={inputClass} />}
        </FormField>

        <FormField
          label="Statement / Bill ID"
          htmlFor="statementId"
          error={errors.statementId?.message}
        >
          {(field) => <input {...field} {...register("statementId")} className={inputClass} />}
        </FormField>

        <FormField
          label="Customer / Business Name"
          htmlFor="companyName"
          error={errors.companyName?.message}
        >
          {(field) => <input {...field} {...register("companyName")} className={inputClass} />}
        </FormField>

        <FormField
          label="Property Address"
          htmlFor="propertyAddress"
          error={errors.propertyAddress?.message}
        >
          {(field) => (
            <input
              {...field}
              {...register("propertyAddress")}
              placeholder="Enter property address"
              className={inputClass}
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Issue / Record / Invoice Date"
            htmlFor="issueDate"
            error={errors.issueDate?.message}
          >
            {(field) => (
              <input {...field} type="date" {...register("issueDate")} className={inputClass} />
            )}
          </FormField>

          <FormField label="Due / Pay Date" htmlFor="dueDate" error={errors.dueDate?.message}>
            {(field) => (
              <input {...field} type="date" {...register("dueDate")} className={inputClass} />
            )}
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <legend className="px-2 text-sm font-semibold text-foreground">Payment info</legend>

        <FormField
          label="Bill Description / Explanation"
          htmlFor="description"
          error={errors.description?.message}
        >
          {(field) => (
            <input
              {...field}
              {...register("description")}
              placeholder="e.g. Utility, rent"
              className={inputClass}
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Prev Payments"
            htmlFor="previousPayments"
            error={errors.previousPayments?.message}
          >
            {(field) => (
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                  $
                </span>
                <input
                  {...field}
                  {...register("previousPayments")}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${inputClass} pl-7 tabular-nums`}
                />
              </div>
            )}
          </FormField>

          <FormField label="Current Due" htmlFor="currentDue" error={errors.currentDue?.message}>
            {(field) => (
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
                  $
                </span>
                <input
                  {...field}
                  {...register("currentDue")}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${inputClass} pl-7 tabular-nums`}
                />
              </div>
            )}
          </FormField>
        </div>

        <FormField
          label="Account Status"
          htmlFor="accountStatus"
          error={errors.accountStatus?.message}
        >
          {(field) => (
            <select
              {...field}
              {...register("accountStatus")}
              className={`${inputClass} capitalize`}
            >
              {accountStatuses.map((status) => (
                <option key={status} value={status}>
                  {status || "Select status"}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField
          label="Payment / Processing Notes (optional)"
          htmlFor="notes"
          error={errors.notes?.message}
        >
          {(field) => (
            <textarea {...field} {...register("notes")} rows={4} className={inputClass} />
          )}
        </FormField>

        <FormField
          label="Website Name (optional)"
          htmlFor="websiteName"
          error={errors.websiteName?.message}
        >
          {(field) => (
            <input
              {...field}
              {...register("websiteName")}
              placeholder="https://domainname.com"
              className={inputClass}
            />
          )}
        </FormField>
      </fieldset>

      <Button
        label={isSubmitting ? "Creating…" : "Create"}
        type="submit"
        disabled={isSubmitting}
        className="w-full border-2"
      />
    </form>
  );
}
