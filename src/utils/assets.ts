import {
  DEFAULT_GOLD_KARAT,
  KARAT_PURITY,
  LAND_PROPERTY_TYPES,
  MetalRates,
  ORNAMENT_TYPES,
  OrnamentModel,
  PropertyModel,
} from "../models/AssetModel";

/** The pavan / sovereign used across Kerala and Tamil Nadu. */
export const GRAMS_PER_PAWN = 8;
export const CENTS_PER_ACRE = 100;

/**
 * Trims float noise without lying about precision: 2.0000000000000004 -> 2,
 * but 0.3333333 keeps four decimals. Empty in, empty out.
 */
export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return "";
  }
  return String(parseFloat(value.toFixed(4)));
};

/**
 * All of these take `string | undefined`: a row written before a
 * field existed comes back with it undefined, and `undefined.trim()` throws.
 */

/** Divides a canonical value into display units, e.g. grams -> pawn. */
export const toUnit = (canonical: string | undefined, perUnit: number) => {
  const text = canonical ?? "";
  const parsed = Number(text);
  if (!text.trim() || Number.isNaN(parsed)) {
    return "";
  }
  return formatNumber(parsed / perUnit);
};

/** Multiplies display units back into the canonical value, e.g. pawn -> grams. */
export const fromUnit = (unitValue: string | undefined, perUnit: number) => {
  const text = unitValue ?? "";
  const parsed = Number(text);
  if (!text.trim() || Number.isNaN(parsed)) {
    return "";
  }
  return formatNumber(parsed * perUnit);
};

export const gramsToPawn = (grams?: string) => toUnit(grams, GRAMS_PER_PAWN);
export const centsToAcres = (cents?: string) => toUnit(cents, CENTS_PER_ACRE);

/** "16 g · 2 pawn", or just "16 g" when the weight isn't a whole pawn count. */
export const weightSummary = (grams?: string) => {
  const text = (grams ?? "").trim();
  if (!text) {
    return "";
  }
  const pawn = gramsToPawn(text);
  return pawn ? `${text} g · ${pawn} pawn` : `${text} g`;
};

/** "150 cents · 1.5 acres". Blank for assets with no area. */
export const areaSummary = (cents?: string) => {
  const text = (cents ?? "").trim();
  if (!text) {
    return "";
  }
  const acres = centsToAcres(text);
  return acres ? `${text} cents · ${acres} acres` : `${text} cents`;
};

/** Cars and bikes have no area, so the form hides the cents field for them. */
export const hasArea = (propertyType: string) =>
  LAND_PROPERTY_TYPES.includes(propertyType);

export type KaratTotal = { karat: string; grams: number; value: number };

export type MetalTotal = {
  metal: string;
  grams: number;
  pieces: number;
  value: number;
  /** False for diamond and platinum: weight is known, worth is not. */
  valued: boolean;
  /** Gold only. One entry per karat present, purest first. */
  karats: KaratTotal[];
};

/** The 24K spot rate for the metal, before purity is applied. */
const spotRateFor = (metal: string, rates: MetalRates) => {
  if (metal === "Gold") return Number(rates.goldPerGram) || 0;
  if (metal === "Silver") return Number(rates.silverPerGram) || 0;
  return 0;
};

/** The karat a gold row is valued at. Blank means the pre-karat default. */
export const karatOf = (ornament: { ornamentType: string; karat?: string }) => {
  if (ornament.ornamentType !== "Gold") {
    return "";
  }
  return ornament.karat || DEFAULT_GOLD_KARAT;
};

/**
 * What one gram of this ornament is worth. Gold is quoted at 24K, so an 18K
 * piece is worth three quarters of the spot rate per gram.
 */
export const ratePerGram = (
  ornament: { ornamentType: string; karat?: string },
  rates: MetalRates
) => {
  const spot = spotRateFor(ornament.ornamentType, rates);
  if (!spot) {
    return 0;
  }
  if (ornament.ornamentType !== "Gold") {
    return spot;
  }
  return spot * (KARAT_PURITY[karatOf(ornament)] ?? KARAT_PURITY[DEFAULT_GOLD_KARAT]);
};

/** Purest first, so 24K heads the list regardless of insertion order. */
const byPurity = (a: KaratTotal, b: KaratTotal) =>
  (KARAT_PURITY[b.karat] ?? 0) - (KARAT_PURITY[a.karat] ?? 0);

/** Ornaments rolled up per metal, in the order the metals are declared. */
export const ornamentTotals = (
  ornaments: OrnamentModel[],
  rates: MetalRates
) => {
  const byMetal = new Map<string, MetalTotal>();

  ornaments.forEach((ornament) => {
    const metal = ornament.ornamentType || "Other";
    const grams = Number(ornament.grams) || 0;
    const pieces = Math.max(Number(ornament.count) || 1, 1);
    const spot = spotRateFor(metal, rates);
    const value = grams * ratePerGram(ornament, rates);

    const existing = byMetal.get(metal) ?? {
      metal,
      grams: 0,
      pieces: 0,
      value: 0,
      valued: spot > 0,
      karats: [] as KaratTotal[],
    };

    existing.grams += grams;
    existing.pieces += pieces;
    existing.value += value;
    existing.valued = spot > 0;

    if (metal === "Gold") {
      const karat = karatOf(ornament);
      const bucket = existing.karats.find((entry) => entry.karat === karat);
      if (bucket) {
        bucket.grams += grams;
        bucket.value += value;
      } else {
        existing.karats.push({ karat, grams, value });
      }
    }

    byMetal.set(metal, existing);
  });

  const rows = [...byMetal.values()]
    .map((row) => ({ ...row, karats: [...row.karats].sort(byPurity) }))
    .sort(
      (a, b) =>
        ORNAMENT_TYPES.indexOf(a.metal as any) -
        ORNAMENT_TYPES.indexOf(b.metal as any)
    );

  return {
    rows,
    totalValue: rows.reduce((sum, row) => sum + row.value, 0),
    totalGrams: rows.reduce((sum, row) => sum + row.grams, 0),
    /** True when at least one metal has no rate, so the total understates. */
    hasUnvalued: rows.some((row) => !row.valued && row.grams > 0),
    /** True when a gold row predates the karat field and was assumed 22K. */
    hasAssumedKarat: ornaments.some(
      (ornament) => ornament.ornamentType === "Gold" && !ornament.karat
    ),
  };
};

export type HolderTotal = { name: string; grams: number; value: number };

/**
 * Who holds what, by value — the second question after "how much do we have".
 * Grouped by the owning member (`ownerId`), whose name is resolved via `nameOf`
 * (see `useOwnerName`); records with no resolvable owner fall under "Unassigned".
 */
export const ornamentsByHolder = (
  ornaments: OrnamentModel[],
  rates: MetalRates,
  nameOf: (ownerId: string) => string
): HolderTotal[] => {
  const byOwner = new Map<string, HolderTotal>();

  ornaments.forEach((ornament) => {
    const key = ornament.ownerId || "";
    const name = nameOf(key) || "Unassigned";
    const grams = Number(ornament.grams) || 0;
    const value = grams * ratePerGram(ornament, rates);

    const existing = byOwner.get(key) ?? { name, grams: 0, value: 0 };
    existing.grams += grams;
    existing.value += value;
    byOwner.set(key, existing);
  });

  return [...byOwner.values()].sort((a, b) => b.value - a.value || b.grams - a.grams);
};

export type PropertyPortfolio = {
  count: number;
  /** Sum of every property's value, counted in full — see `PropertyModel.totalAmount`. */
  total: number;
};

export const propertyPortfolio = (
  properties: PropertyModel[]
): PropertyPortfolio => ({
  count: properties.length,
  total: properties.reduce(
    (total, property) => total + (Number(property.totalAmount) || 0),
    0
  ),
});
