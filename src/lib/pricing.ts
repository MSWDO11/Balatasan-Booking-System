/**
 * Pricing utilities for Balatasan Booking System
 * Group discounts only — seasonal pricing is disabled.
 * Admin controls pricing via the inventory rate field.
 */

// ─── Group Discount ──────────────────────────────────────────────────────────

export interface GroupDiscount {
  minGuests: number;
  discountPercent: number;
  label: string;
}

export const GROUP_DISCOUNTS: GroupDiscount[] = [
  { minGuests: 10, discountPercent: 10, label: "10% group discount (10+ guests)" },
  { minGuests: 20, discountPercent: 15, label: "15% group discount (20+ guests)" },
  { minGuests: 30, discountPercent: 20, label: "20% group discount (30+ guests)" },
];

export function getGroupDiscount(guestCount: number): GroupDiscount | null {
  const applicable = GROUP_DISCOUNTS.filter((d) => guestCount >= d.minGuests);
  if (!applicable.length) return null;
  return applicable[applicable.length - 1];
}

export function applyGroupDiscount(price: number, guestCount: number): number {
  const discount = getGroupDiscount(guestCount);
  if (!discount) return price;
  return Math.round(price * (1 - discount.discountPercent / 100));
}

// ─── Package Deal ────────────────────────────────────────────────────────────

export interface PackageDeal {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  requiresCottage: boolean;
  requiresTour: boolean;
  badge: string;
}

export const PACKAGE_DEALS: PackageDeal[] = [
  {
    id: "staycation",
    name: "Staycation Bundle",
    description: "Book any cottage + any island hopping tour",
    discountPercent: 10,
    requiresCottage: true,
    requiresTour: true,
    badge: "Save 10%",
  },
  {
    id: "adventure",
    name: "Adventure Package",
    description: "Book any cottage + 2 or more water activities",
    discountPercent: 15,
    requiresCottage: true,
    requiresTour: true,
    badge: "Save 15%",
  },
];

// ─── Combined Price Calculator ───────────────────────────────────────────────

// Kept for backward compatibility — seasonInfo is always null now
export interface SeasonRate {
  season: string;
  label: string;
  multiplier: number;
  color: string;
  months: number[];
}

export interface PriceBreakdown {
  basePrice: number;
  afterSeasonal: number;
  afterGroupDiscount: number;
  finalPrice: number;
  seasonInfo: null;
  groupDiscountInfo: GroupDiscount | null;
  savings: number;
}

export function calculatePrice({
  baseRate,
  guestCount,
  nights = 1,
  isPerMinute = false,
  minutes = 0,
}: {
  baseRate: number;
  guestCount: number;
  nights?: number;
  date?: Date;        // kept in signature for backward compat, not used
  isPerMinute?: boolean;
  minutes?: number;
}): PriceBreakdown {
  // Base calculation
  let basePrice: number;
  if (isPerMinute) {
    basePrice = baseRate * minutes;
  } else {
    basePrice = baseRate * guestCount * nights;
  }

  // No seasonal multiplier — afterSeasonal equals basePrice
  const afterSeasonal = basePrice;

  // Group discount (only for per-person pricing)
  const groupDiscountInfo = !isPerMinute ? getGroupDiscount(guestCount) : null;
  const discountMultiplier = groupDiscountInfo
    ? 1 - groupDiscountInfo.discountPercent / 100
    : 1;
  const afterGroupDiscount = Math.round(afterSeasonal * discountMultiplier);

  const finalPrice = afterGroupDiscount;
  const savings = basePrice - finalPrice;

  return {
    basePrice,
    afterSeasonal,
    afterGroupDiscount,
    finalPrice,
    seasonInfo: null,
    groupDiscountInfo,
    savings,
  };
}
