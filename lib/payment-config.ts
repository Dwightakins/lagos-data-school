function getNumberEnv(name: string, fallback: number): number {
  const raw = (typeof process !== "undefined" ? process.env[name] : undefined) ?? "";
  const value = Number(raw || fallback);
  return Number.isFinite(value) ? value : fallback;
}

export const PAYMENT_CONFIG = {
  scholarshipFee: getNumberEnv("NEXT_PUBLIC_SCHOLARSHIP_FEE", getNumberEnv("SCHOLARSHIP_FEE", 15000)),
  bulkDiscountThreshold: getNumberEnv("NEXT_PUBLIC_BULK_DISCOUNT_THRESHOLD", getNumberEnv("BULK_DISCOUNT_THRESHOLD", 3)),
  bulkDiscountRate: getNumberEnv("NEXT_PUBLIC_BULK_DISCOUNT_RATE", getNumberEnv("BULK_DISCOUNT_RATE", 0.1)),
};

export function computeExpectedCourseTotal(prices: number[]): number {
  const total = prices.reduce((sum, price) => sum + price, 0);
  return prices.length >= PAYMENT_CONFIG.bulkDiscountThreshold
    ? Math.round(total * (1 - PAYMENT_CONFIG.bulkDiscountRate))
    : total;
}

export function getExpectedPaymentAmount(prices: number[], paymentType: "full" | "scholarship" | string): number {
  return paymentType === "scholarship"
    ? PAYMENT_CONFIG.scholarshipFee
    : computeExpectedCourseTotal(prices);
}
