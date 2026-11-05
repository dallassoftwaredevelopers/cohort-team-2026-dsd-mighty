export type RuleInput = {
  invoice_maximum: string;
  min_approvals: string;
};

export type RuleErrors = {
  invoice_maximum?: string;
  min_approvals?: string;
};

export function validateRules(input: RuleInput): RuleErrors {
  const errors: RuleErrors = {};

  const max = input.invoice_maximum.trim();
  if (max === "") {
    errors.invoice_maximum = "Invoice maximum is required.";
  } else if (!Number.isFinite(Number(max)) || Number(max) <= 0) {
    errors.invoice_maximum = "Invoice maximum must be a positive number.";
  }

  const min = input.min_approvals.trim();
  if (min === "") {
    errors.min_approvals = "Minimum approvals is required.";
  } else if (!Number.isFinite(Number(min)) || Number(min) <= 0 || !Number.isInteger(Number(min))) {
    errors.min_approvals = "Minimum approvals must be a positive whole number.";
  }

  return errors;
}
