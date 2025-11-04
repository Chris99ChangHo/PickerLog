// src/infoData.ts
// Simple loader for postcode eligibility data with a future-proof interface.
// Current source: bundled JSON under assets/data/postcodes.sample.json
// Later: swap to remote JSON endpoint or local DB as needed.

export type PostcodeRecord = {
  postcode: string;
  suburb: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  eligible: boolean;
  note?: string;
};

/**
 * Load bundled sample data. Metro can import JSON at build time.
 */
export async function loadBundledPostcodes(): Promise<PostcodeRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data: PostcodeRecord[] = require('../assets/data/postcodes.sample.json');
  return data;
}

/**
 * Placeholder for future remote fetch.
 * How to adopt in the future:
 * 1) Host a JSON at a trusted URL with the same schema as PostcodeRecord[].
 * 2) Use fetch(url).then(r => r.json()).
 * 3) Validate shape before returning; cache to AsyncStorage if needed.
 */
export async function loadPostcodesFrom(url: string): Promise<PostcodeRecord[]> {
  // Example sketch (disabled to avoid network in dev sandbox):
  // const res = await fetch(url);
  // if (!res.ok) throw new Error(`Failed to fetch postcodes: ${res.status}`);
  // const json = await res.json();
  // return Array.isArray(json) ? json as PostcodeRecord[] : [];
  throw new Error('Remote loading not configured. Use loadBundledPostcodes().');
}

