/**
 * Pricing utilities for Balatasan Booking System
 * Handles seasonal pricing, package deals, and group discounts
 */

// ─── Seasonal Pricing ───────────────────────────────────────────────────────

export type Season = "summer" | "holiday" | "off-peak";

export interface SeasonRate {
  season: Season;
  label: string;
  multiplier: number; // e.g. 1.3 = 30% more expensive
  color: string;
  months: number[]; // 0=Jan, 11=Dec
}

export const SEASONS: SeasonRate[] = [
  {
    season: "summer",
    label: "Summer Peak",
    multiplier: 1.3,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    months: [3, 4, 5], // April, May, June
  },
  {
    season: "holiday",
    label: "Holiday Season",
    multiplier: 1.5,
    color: "text-red-600 bg-red-50 border-red-200",
    months: [11, 0], // December, January
  },
  {
    season: "off-peak",
    label: "Off-Peak",
    multiplier: 0.85,
    color: "text-green-600 bg-green-50 border-green-200",
    months: [1, 2, 6, 7, 8], // Feb, Mar, Jul, Aug, Sep
  },
];

export function getSeasonForDate(date: Date): SeasonRate | null {
  const month = date.getMonth();
  return SEASONS.find((s) => s.months.includes(month)) ?? null;
}

export function applySeasonalMultiplier(baseRate: number, date: Date): number {
  const season = getSeasonForDate(date);
  if (!season) return baseRate;
  return Math.round(baseRate * season.multiplier);
}

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
  // Find the best discount tier (highest applicable)
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

export interface PriceBreakdown {
  basePrice: number;
  afterSeasonal: number;
  afterGroupDiscount: number;
  finalPrice: number;
  seasonInfo: SeasonRate | null;
  groupDiscountInfo: GroupDiscount | null;
  savings: number;
}

export function calculatePrice({
  baseRate,
  guestCount,
  nights = 1,
  date,
  isPerMinute = false,
  minutes = 0,
}: {
  baseRate: number;
  guestCount: number;
  nights?: number;
  date?: Date;
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

  // Apply seasonal pricing
  const seasonInfo = date ? getSeasonForDate(date) : null;
  const seasonMultiplier = seasonInfo ? seasonInfo.multiplier : 1;
  const afterSeasonal = Math.round(basePrice * seasonMultiplier);

  // Apply group discount (only for per-person pricing)
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
    seasonInfo,
    groupDiscountInfo,
    savings,
  };
}
