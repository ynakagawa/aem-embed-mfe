// Locale-specific labels for the header MFE.
//
// The AEM DA `mfe` block reads a DA JSON sheet and passes its first row
// (`data[0]`) into the custom element as the `labels` attribute/property:
//
//   el.setAttribute('labels', JSON.stringify(sheet.data[0]));
//   // or, equivalently:
//   el.labels = sheet.data[0];
//
// Every key is optional; anything missing or invalid falls back to the English
// default below, so an empty/absent/malformed value keeps current behaviour.

export interface HeaderLabels {
  openNavigation: string;
  closeNavigation: string;
  brandAlt: string;
  searchPlaceholder: string;
  search: string;
  askAi: string;
  login: string;
  register: string;
  account: string;
  country: string;
  countryPrefix: string;
  allCategories: string;
  orderEntry: string;
  cart: string;
  cartSubtotal: string;
  /** Per-nav-entry overrides, keyed by the entry's href path. */
  nav: Record<string, string>;
}

export const DEFAULT_LABELS: HeaderLabels = {
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  brandAlt: 'VWR, part of Avantor',
  searchPlaceholder: 'Search by keyword, supplier, or part number',
  search: 'Search',
  askAi: 'Ask AI',
  login: 'Login',
  register: 'Register',
  account: 'Account',
  country: 'United States',
  countryPrefix: 'Country',
  allCategories: 'All Categories',
  orderEntry: 'Order Entry',
  cart: 'Cart',
  cartSubtotal: '$0.00',
  nav: {},
};

const TEXT_KEYS = (Object.keys(DEFAULT_LABELS) as (keyof HeaderLabels)[]).filter(
  (key) => key !== 'nav',
) as Exclude<keyof HeaderLabels, 'nav'>[];

// DA sheets are flat key/value rows, so nav overrides arrive as columns named
// `nav./us/en/products`. A nested `{ "nav": { "/us/en/products": "..." } }`
// object is accepted too, for hosts that can pass richer JSON.
const NAV_KEY_PREFIX = 'nav.';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parses a JSON string / already-parsed object into a raw record, or null. */
function toRecord(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    try {
      return toRecord(JSON.parse(trimmed));
    } catch {
      // Malformed JSON must never break the header - fall back to defaults.
      return null;
    }
  }

  // Tolerate the whole sheet (`{ data: [...] }`) or a bare `data` array being
  // handed over instead of the single row.
  if (Array.isArray(input)) return toRecord(input[0]);
  if (isPlainObject(input)) {
    if (Array.isArray(input['data'])) return toRecord(input['data']);
    return input;
  }

  return null;
}

/**
 * Merges caller-supplied labels over the English defaults. Never throws:
 * unusable input (null, malformed JSON, wrong types) yields the defaults.
 */
export function normalizeLabels(input: unknown): HeaderLabels {
  const raw = toRecord(input);
  const merged: HeaderLabels = { ...DEFAULT_LABELS, nav: { ...DEFAULT_LABELS.nav } };
  if (!raw) return merged;

  for (const key of TEXT_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      merged[key] = value.trim();
    }
  }

  const nested = raw['nav'];
  if (isPlainObject(nested)) {
    for (const [href, value] of Object.entries(nested)) {
      if (typeof value === 'string' && value.trim()) merged.nav[href] = value.trim();
    }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith(NAV_KEY_PREFIX)) continue;
    const href = key.slice(NAV_KEY_PREFIX.length);
    if (href && typeof value === 'string' && value.trim()) merged.nav[href] = value.trim();
  }

  return merged;
}
