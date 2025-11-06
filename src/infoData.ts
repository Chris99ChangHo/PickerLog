// src/infoData.ts
// Simple loader + merger for Australian postcodes with eligibility overlay.
// Source: assets/data/australian_postcodes.json (all suburbs).
// We map it to PostcodeRecord and overlay government eligibility rules.

export type PostcodeRecord = {
  postcode: string;
  suburb: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  eligible: boolean;
  note?: string;
};

// Backwards-compatible shim: previously loaded a small sample JSON.
// Now delegates to the full australian_postcodes.json pipeline.
export async function loadBundledPostcodes(): Promise<PostcodeRecord[]> {
  return loadAustralianPostcodes();
}

type RawAUPostcode = Record<string, unknown> & {
  postcode?: string | number;
  pcode?: string | number;
  suburb?: string;
  locality?: string;
  locality_name?: string;
  state?: string;
};

/**
 * Load the big AU postcode list and map to PostcodeRecord with default eligible=false.
 */
export async function loadAustralianPostcodesBase(): Promise<PostcodeRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw: RawAUPostcode[] = require('../assets/data/australian_postcodes.json');
  const mapState = (s: string): PostcodeRecord['state'] => (s || '').toUpperCase() as any;
  const out: PostcodeRecord[] = [];
  const clean = (txt: string) => {
    return (txt || '')
      .replace(/\s*쨌\s*/g, ' · ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };
  for (const r of raw) {
    const pcRaw = (r.postcode ?? r.pcode ?? '').toString();
    if (!pcRaw) continue;
    const postcode = pcRaw.padStart(4, '0');
    const state = mapState((r.state as string) ?? '');
    let suburb = clean((r.suburb || r.locality || r.locality_name || '').toString());
    // Remove duplicated state suffix like "SUBURB SA"
    if (state && suburb.toUpperCase().endsWith(' ' + state)) {
      suburb = suburb.slice(0, -(' ' + state).length).trim();
    }
    if (!postcode || !suburb || !state) continue;
    out.push({ postcode, suburb, state, eligible: false });
  }
  return out;
}

export type EligibilityRule = {
  when: (rec: PostcodeRecord) => boolean;
  note: string;
};

/**
 * Minimal example overlay rules. Replace/extend with full Table guidance when ready.
 */
export function defaultEligibilityRules(): EligibilityRule[] {
  const inRange = (pc: string, a: number, b: number) => {
    const n = Number(pc);
    return n >= a && n <= b;
  };
  return [
    // Example: NSW regional band 2311-2411
    { when: (r) => r.state === 'NSW' && inRange(r.postcode, 2311, 2411), note: 'Eligible region (Regional Australia)' },
    // Example: All SA
    { when: (r) => r.state === 'SA', note: 'Eligible region (Regional Australia)' },
    // Example: All TAS
    { when: (r) => r.state === 'TAS', note: 'Eligible region (Regional Australia)' },
    // Example: Natural disaster work (sample)
    { when: (r) => r.state === 'QLD' && r.postcode === '4000', note: 'Eligible - disaster recovery only' },
  ];
}

export function applyEligibility(records: PostcodeRecord[], rules = defaultEligibilityRules()): PostcodeRecord[] {
  for (const rec of records) {
    for (const rule of rules) {
      if (rule.when(rec)) {
        rec.eligible = true;
        rec.note = rule.note;
        break;
      }
    }
  }
  return records;
}

/**
 * High-level loader used by Info screen.
 * Maps raw AU list -> PostcodeRecord -> overlays rules.
 */
export async function loadAustralianPostcodes(): Promise<PostcodeRecord[]> {
  const base = await loadAustralianPostcodesBase();
  return applyEligibility(base);
}

/**
 * Placeholder for future remote fetch.
 */
export async function loadPostcodesFrom(url: string): Promise<PostcodeRecord[]> {
  throw new Error('Remote loading not configured. Use loadBundledPostcodes().');
}
