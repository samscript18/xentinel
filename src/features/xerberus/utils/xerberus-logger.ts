import "server-only";

export function logXerberusWarning(message: string, details?: unknown) {
  const printableDetails = normalizeLogDetails(details);

  console.warn("[xerberus]", message, printableDetails ?? "");
}

function normalizeLogDetails(details: unknown) {
  if (typeof details === "string") {
    return sanitizeDetail(details);
  }

  if (!(details instanceof Error)) {
    return details;
  }

  const record = details as Error & {
    status?: unknown;
    endpoint?: unknown;
    code?: unknown;
    detail?: unknown;
  };

  return {
    message: details.message,
    status: typeof record.status === "number" ? record.status : undefined,
    endpoint: typeof record.endpoint === "string" ? record.endpoint : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    detail: typeof record.detail === "string" ? sanitizeDetail(record.detail) : undefined
  };
}

function sanitizeDetail(detail: string) {
  const normalized = detail.toLowerCase();

  if (
    normalized.includes("just a moment")
    || normalized.includes("challenges.cloudflare.com")
    || normalized.includes("cloudflare")
  ) {
    return "Cloudflare challenge page returned by Xerberus MCP before JSON-RPC handling.";
  }

  return detail.slice(0, 500);
}
