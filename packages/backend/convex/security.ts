const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeText(value: string, maxLength = 280): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeOptionalText(value: string | undefined, maxLength = 280): string | undefined {
  if (value === undefined) return undefined;
  const sanitized = sanitizeText(value, maxLength);
  return sanitized.length > 0 ? sanitized : undefined;
}

export function normalizeEmail(value: string): string {
  const email = sanitizeText(value, 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Invalid email format");
  }
  return email;
}

export function assertDateString(value: string): string {
  const date = sanitizeText(value, 10);
  if (!DATE_PATTERN.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }
  return date;
}

export function assertPositiveInteger(value: number, field: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}
