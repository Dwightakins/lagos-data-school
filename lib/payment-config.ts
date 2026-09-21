function getNumberEnv(name: string, fallback: number): number {
  const raw = (typeof process !== "undefined" ? process.env[name] : undefined) ?? "";
  const value = Number(raw || fallback);
  return Number.isFinite(value) ? value : fallback;
}

export const PAYMENT_CONFIG = {
  scholarshipFee: getNumberEnv("NEXT_PUBLIC_SCHOLARSHIP_FEE", getNumberEnv("SCHOLARSHIP_FEE", 15000)),
};

// One course per student, so the full price is simply the sum of the (single) course price.
export function computeExpectedCourseTotal(prices: number[]): number {
  return prices.reduce((sum, price) => sum + price, 0);
}

export function getExpectedPaymentAmount(prices: number[], paymentType: "full" | "scholarship" | string): number {
  return paymentType === "scholarship"
    ? PAYMENT_CONFIG.scholarshipFee
    : computeExpectedCourseTotal(prices);
}
