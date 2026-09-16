export type AlatpayTxStatus = "success" | "failed" | "pending" | "unknown";

export type AlatpayTransactionResult = {
  ok: boolean;
  status: AlatpayTxStatus;
  reference: string;
  amountNaira: number;
  raw: unknown;
};

function getFirstValue<T>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function walkForCandidateObjects(value: unknown, limit = 50): Array<Record<string, unknown>> {
  if (limit <= 0) return [];
  const matches: Array<Record<string, unknown>> = [];

  if (value && typeof value === "object") {
    if (!Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      matches.push(obj);
      for (const child of Object.values(obj)) {
        matches.push(...walkForCandidateObjects(child, limit - 1));
      }
      return matches;
    }

    for (const child of value) {
      matches.push(...walkForCandidateObjects(child, limit - 1));
    }
  }

  return matches;
}

function normalizeAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[₦,\s]/g, "");
    const num = Number(cleaned.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function toStatus(value: unknown): AlatpayTxStatus {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (["success", "successful", "paid", "completed", "approved", "succeeded"].includes(normalized)) return "success";
  if (["failed", "cancelled", "canceled", "declined", "rejected"].includes(normalized)) return "failed";
  if (["pending", "processing", "queued", "inprogress", "in_progress"].includes(normalized)) return "pending";
  return "unknown";
}

function extractTransactionPayload(payload: unknown): { status: AlatpayTxStatus; amount: number; reference: string } {
  const roots: Array<Record<string, unknown>> = [];
  const root = (payload ?? {}) as Record<string, unknown>;
  roots.push(root);

  const maybeData = root.data ?? root.payload ?? root.result ?? root.transaction ?? root.record;
  if (maybeData && typeof maybeData === "object") roots.push(maybeData as Record<string, unknown>);

  const candidateObjects = walkForCandidateObjects(payload, 40);
  for (const candidate of candidateObjects) {
    if (candidate && typeof candidate === "object") roots.push(candidate as Record<string, unknown>);
  }

  let status: unknown = "unknown";
  let amount = 0;
  let reference = "";

  for (const current of roots) {
    const candidateStatus =
      getFirstValue<string>(current, [
        "status",
        "transactionStatus",
        "paymentStatus",
        "state",
        "state_name",
        "responseCode",
        "transaction_state",
      ]);
    if (candidateStatus !== undefined && candidateStatus !== null) {
      status = candidateStatus;
    }

    const candidateAmount =
      getFirstValue<number | string>(current, [
        "amount",
        "totalAmount",
        "amountPaid",
        "paidAmount",
        "transactionAmount",
        "amount_paid",
        "total_amount",
      ]);
    if (candidateAmount !== undefined && candidateAmount !== null) {
      const normalized = normalizeAmount(candidateAmount);
      if (normalized > 0) amount = normalized;
    }

    const candidateReference =
      getFirstValue<string | number>(current, [
        "reference",
        "transactionReference",
        "trxref",
        "referenceCode",
        "reference_code",
        "id",
        "transaction_id",
      ]);
    if (candidateReference !== undefined && candidateReference !== null && String(candidateReference).trim()) {
      reference = String(candidateReference);
    }
  }

  const normalizedAmount = amount > 1_000_000 ? amount / 100 : amount;
  return { status: toStatus(status), amount: normalizedAmount, reference };
}

export function getAlatpayConfig() {
  const apiKey = process.env.NEXT_PUBLIC_ALATPAY_API_KEY || process.env.ALATPAY_API_KEY;
  const businessId = process.env.ALATPAY_BUSINESS_ID;
  const secretKey = process.env.ALATPAY_SECRET_KEY;
  const apiUrl = process.env.ALATPAY_API_URL || "https://apibox.alatpay.ng";

  return { apiKey, businessId, secretKey, apiUrl };
}

export async function verifyAlatpayTransaction(reference: string): Promise<AlatpayTransactionResult> {
  const { apiKey, secretKey, apiUrl } = getAlatpayConfig();
  if (!reference || !secretKey || !apiUrl) {
    throw new Error("ALATPay verification is not configured.");
  }

  const candidateUrls = [
    `${apiUrl.replace(/\/$/, "")}/api/v1/transactions/${encodeURIComponent(reference)}`,
    `${apiUrl.replace(/\/$/, "")}/api/v1/transaction/${encodeURIComponent(reference)}`,
    `${apiUrl.replace(/\/$/, "")}/api/transactions/${encodeURIComponent(reference)}`,
    `${apiUrl.replace(/\/$/, "")}/transactions/${encodeURIComponent(reference)}`,
    `${apiUrl.replace(/\/$/, "")}/api/v1/transactions?reference=${encodeURIComponent(reference)}`,
    `${apiUrl.replace(/\/$/, "")}/api/transactions?reference=${encodeURIComponent(reference)}`,
  ];

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
    "Ocp-Apim-Subscription-Key": secretKey,
    "x-api-key": apiKey ?? secretKey,
  };

  let lastError: unknown;

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        lastError = new Error(`ALATPay lookup failed with ${res.status}`);
        continue;
      }

      const payload = await res.json();
      const extracted = extractTransactionPayload(payload);
      const status = extracted.status;
      const amount = extracted.amount;

      const normalizedAmount = amount > 1_000_000 ? amount / 100 : amount;
      const referenceFromPayload = extracted.reference || reference;

      return {
        ok: status === "success",
        status,
        reference: referenceFromPayload,
        amountNaira: normalizedAmount,
        raw: payload,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to query ALATPay transaction.");
}
