/**
 * Amount Banding for De-identified Analytics
 * All amounts are in minor units (pennies/cents)
 */

export type AmountBandId = 
 | "0-0"
 | "0-500"
 | "500-1k"
 | "1-2k"
 | "2-5k"
 | "5-10k"
 | "10-20k"
 | "20-50k"
 | "50k+";

export type DeltaBandId = 
 | "-5k+"
 | "-2k-5k"
 | "-1k-2k"
 | "-500-1k"
 | "-100-500"
 | "-0-100"
 | "0"
 | "+0-100"
 | "+100-500"
 | "+500-1k"
 | "+1k-2k"
 | "+2k-5k"
 | "+5k+";

const AMOUNT_BANDS: Array<[number, AmountBandId]> = [
 [0, "0-0"],
 [50000, "0-500"],   // £500
 [100000, "500-1k"],  // £1,000
 [200000, "1-2k"],   // £2,000
 [500000, "2-5k"],   // £5,000
 [1000000, "5-10k"],  // £10,000
 [2000000, "10-20k"],  // £20,000
 [5000000, "20-50k"],  // £50,000
 [Infinity, "50k+"]
];

const DELTA_BANDS: Array<[number, DeltaBandId]> = [
 [-500000, "-5k+"],   // Lost more than £5k
 [-200000, "-2k-5k"],  // Lost £2k-5k
 [-100000, "-1k-2k"],  // Lost £1k-2k
 [-50000, "-500-1k"],  // Lost £500-1k
 [-10000, "-100-500"],  // Lost £100-500
 [-1, "-0-100"],     // Lost £0-100
 [0, "0"],        // No change
 [10000, "+0-100"],   // Gained £0-100
 [50000, "+100-500"],  // Gained £100-500
 [100000, "+500-1k"],  // Gained £500-1k
 [200000, "+1k-2k"],   // Gained £1k-2k
 [500000, "+2k-5k"],   // Gained £2k-5k
 [Infinity, "+5k+"]   // Gained more than £5k
];

/**
 * Band an amount for analytics
 * @param minorUnits Amount in pennies/cents
 * @returns Band identifier
 */
export function bandAmount(minorUnits: number): AmountBandId {
 const absAmount = Math.abs(minorUnits);
 
 for (const [threshold, band] of AMOUNT_BANDS) {
  if (absAmount < threshold) {
   return band;
  }
 }
 
 return "50k+";
}

/**
 * Band a delta (change) for analytics
 * @param deltaMinorUnits Change in pennies/cents (negative for decrease)
 * @returns Delta band identifier
 */
export function bandDelta(deltaMinorUnits: number): DeltaBandId {
 for (const [threshold, band] of DELTA_BANDS) {
  if (deltaMinorUnits < threshold) {
   return band;
  }
 }
 
 return "+5k+";
}

/**
 * Band a portfolio total
 * @param totalMinorUnits Total in pennies/cents
 * @returns Band identifier
 */
export function bandTotal(totalMinorUnits: number): AmountBandId {
 return bandAmount(totalMinorUnits);
}

/**
 * Convert pounds to minor units (pennies)
 */
export function toPennies(pounds: number): number {
 return Math.round(pounds * 100);
}

/**
 * Convert minor units to pounds
 */
export function fromPennies(pennies: number): number {
 return pennies / 100;
}

/**
 * Format a band for display (e.g., "2-5k" -> "£2k-£5k")
 */
export function formatBand(band: AmountBandId): string {
 const mapping: Record<AmountBandId, string> = {
  "0-0": "£0",
  "0-500": "£0-£500",
  "500-1k": "£500-£1k",
  "1-2k": "£1k-£2k",
  "2-5k": "£2k-£5k",
  "5-10k": "£5k-£10k",
  "10-20k": "£10k-£20k",
  "20-50k": "£20k-£50k",
  "50k+": "£50k+"
 };
 
 return mapping[band] || band;
}

/**
 * Format a delta band for display
 */
export function formatDeltaBand(band: DeltaBandId): string {
 const mapping: Record<DeltaBandId, string> = {
  "-5k+": "Decreased £5k+",
  "-2k-5k": "Decreased £2k-£5k",
  "-1k-2k": "Decreased £1k-£2k",
  "-500-1k": "Decreased £500-£1k",
  "-100-500": "Decreased £100-£500",
  "-0-100": "Decreased £0-£100",
  "0": "No change",
  "+0-100": "Increased £0-£100",
  "+100-500": "Increased £100-£500",
  "+500-1k": "Increased £500-£1k",
  "+1k-2k": "Increased £1k-£2k",
  "+2k-5k": "Increased £2k-£5k",
  "+5k+": "Increased £5k+"
 };
 
 return mapping[band] || band;
}

/**
 * Get band statistics for a collection of debts
 */
export function getPortfolioBands(debts: Array<{ balance: number }>): {
 totalBand: AmountBandId;
 distribution: Record<AmountBandId, number>;
 count: number;
} {
 const totalPennies = debts.reduce((sum, debt) => sum + toPennies(debt.amount_pennies), 0);
 const distribution: Record<AmountBandId, number> = {} as any;
 
 debts.forEach(debt => {
  const band = bandAmount(toPennies(debt.amount_pennies));
  distribution[band] = (distribution[band] || 0) + 1;
 });
 
 return {
  totalBand: bandTotal(totalPennies),
  distribution,
  count: debts.length
 };
}