// Contact lens wear durations (how often the lenses are replaced). A product stores one in
// eyewearDetails.wearDuration (set in Admin → Products); older products fall back to their title / category.

export type WearDurationKey = "daily" | "biweekly" | "monthly" | "yearly";

export const WEAR_DURATIONS: { key: WearDurationKey; label: string; code: string; hint: string; match: RegExp }[] = [
  { key: "monthly", label: "Monthly", code: "1M", hint: "Replace every month", match: /month/ },
  { key: "daily", label: "Dailies", code: "1D", hint: "Use once, then throw away", match: /dail|\b1\s*day|one\s*day/ },
  { key: "biweekly", label: "Bi-Weekly", code: "2W", hint: "Replace every 2 weeks", match: /bi\s*-?\s*weekly|fortnight|2\s*weeks?/ },
  { key: "yearly", label: "Yearly", code: "1Y", hint: "Replace every year", match: /year|annual/ },
];

type ProductLike = {
  title?: string;
  eyewearDetails?: { wearDuration?: string };
  category?: string | { name?: string; slug?: string } | null;
};

// The product's duration: the admin-set value, else read from the title / category ("Monthly Disposable")
export function getWearDuration(product?: ProductLike | null) {
  if (!product) return null;
  const saved = product.eyewearDetails?.wearDuration;
  const bySaved = WEAR_DURATIONS.find((d) => d.key === saved);
  if (bySaved) return bySaved;
  const cat = typeof product.category === "object" && product.category ? `${product.category.name || ""} ${product.category.slug || ""}` : "";
  const text = `${product.title || ""} ${cat}`.toLowerCase().replace(/[-_]/g, " ");
  return WEAR_DURATIONS.find((d) => d.match.test(text)) || null;
}

// Contact lens shop types, matching the home page tiles. A product stores one in
// eyewearDetails.lensKind (picked in Admin → Products / Accessories); the shop filters with ?lensType=.
export type LensKindKey = "clear" | "color" | "solution" | "accessories";

export const LENS_KINDS: { key: LensKindKey; label: string; short: string }[] = [
  { key: "clear", label: "Clear Lenses", short: "Clear" },
  { key: "color", label: "Color Lenses", short: "Color" },
  { key: "solution", label: "Solutions", short: "Solution" },
  { key: "accessories", label: "Accessories & Trial Pack", short: "Accessories" },
];

export const isLensKind = (value?: string | null): value is LensKindKey =>
  !!value && LENS_KINDS.some((k) => k.key === value);

// Home page tile → shop link for that type (used when a tile still has an old/default link)
export function lensKindHref(kind: LensKindKey) {
  if (kind === "solution" || kind === "accessories") return `/shop?lensType=${kind}`;
  return `/shop?category=contact-lenses&lensType=${kind}`;
}
