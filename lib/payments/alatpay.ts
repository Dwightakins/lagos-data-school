import { createHmac, timingSafeEqual } from "crypto";

// ALATPay reference: https://docs.alatpay.ng (Transaction Monitoring, Webhook Validation, Web Plugin)

export type AlatpayTxStatus = "success" | "failed" | "pending" | "unknown";

export type AlatpayTransactionResult = {
  ok: boolean;
  status: AlatpayTxStatus;
  /** ALATPay transaction id (`data.id`) */
  reference: string;
  amountNaira: number;
  currency: string;
  email: string;
  /** Parsed `customer.metadata` (the metadata we passed to the web plugin) */
  metadata: Record<string, unknown>;
  raw: unknown;
};

type AlatpayTransactionData = {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  customer?: { email?: string; metadata?: string | null };
};

export function getAlatpayConfig() {
  const publicKey = process.env.ALATPAY_PUBLIC_KEY;
  const businessId = process.env.ALATPAY_BUSINESS_ID;
  const secretKey = process.env.ALATPAY_SECRET_KEY;
  const webhookSecret = process.env.ALATPAY_WEBHOOK_SECRET;
  const apiUrl = process.env.ALATPAY_API_URL || "https://apibox.alatpay.ng";

  return { publicKey, businessId, secretKey, webhookSecret, apiUrl };
}

function toStatus(value: unknown): AlatpayTxStatus {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (normalized === "completed") return "success";
  if (["failed", "cancelled", "canceled", "declined", "rejected", "expired"].includes(normalized)) return "failed";
  if (["pending", "processing"].includes(normalized)) return "pending";
  return "unknown";
}

/** Metadata is passed to the plugin as a JSON string and comes back as `customer.metadata`. */
export function parseAlatpayMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Looks up a transaction with the documented "Get Single Transaction" endpoint:
 * GET {apibox}/alatpaytransaction/api/v1/transactions/{transactionId}
 * Auth: Ocp-Apim-Subscription-Key = merchant secret key.
 */
export async function verifyAlatpayTransaction(transactionId: string): Promise<AlatpayTransactionResult> {
  const { secretKey, apiUrl } = getAlatpayConfig();
  if (!transactionId || !secretKey) {
    throw new Error("ALATPay verification is not configured.");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/alatpaytransaction/api/v1/transactions/${encodeURIComponent(transactionId)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": secretKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ALATPay transaction lookup failed with status ${res.status}`);
  }

  const payload = (await res.json()) as { status?: boolean; message?: string; data?: AlatpayTransactionData | null };
  const data = payload.data;
  if (!payload.status || !data) {
    throw new Error(payload.message || "ALATPay returned no transaction data.");
  }

  const status = toStatus(data.status);
  return {
    ok: status === "success",
    status,
    reference: data.id ?? transactionId,
    amountNaira: typeof data.amount === "number" ? data.amount : 0,
    currency: (data.currency ?? "").toUpperCase(),
    email: data.customer?.email ?? "",
    metadata: parseAlatpayMetadata(data.customer?.metadata),
    raw: payload,
  };
}

/**
 * Webhook validation per docs: x-signature = base64(HMAC-SHA256(rawBody, webhookSecret)).
 * `rawBody` must be the exact, unparsed request body.
 */
export function isValidAlatpaySignature(rawBody: string, receivedSignature: string | null): boolean {
  const { webhookSecret } = getAlatpayConfig();
  if (!webhookSecret || !receivedSignature) return false;

  const computed = createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(computed);
  const b = Buffer.from(receivedSignature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}
