import "server-only";

export function logXerberusWarning(message: string, details?: unknown) {
  const printableDetails = details instanceof Error ? details.message : details;

  console.warn("[xerberus]", message, printableDetails ?? "");
}
