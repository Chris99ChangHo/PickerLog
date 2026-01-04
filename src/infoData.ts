// src/infoData.ts

export type PostcodeRecord = {
  postcode: string;
  suburb: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  eligible: boolean;
  note?: string;
};

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

export async function loadAustralianPostcodesBase(): Promise<PostcodeRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw: RawAUPostcode[] = require('../assets/data/australian_postcodes.json');
  const mapState = (s: string): PostcodeRecord['state'] => (s || '').toUpperCase() as any;
  const out: PostcodeRecord[] = [];
  
  // 안전장치: 혹시라도 남아있을 '쨌' 문자를 조용히 제거합니다.
  const clean = (txt: string) => {
    return (txt || '')
      .replace(/쨌/g, '') 
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  for (const r of raw) {
    const pcRaw = (r.postcode ?? r.pcode ?? '').toString();
    if (!pcRaw) continue;

    const postcode = pcRaw.padStart(4, '0');
    const state = mapState((r.state as string) ?? '');
    let suburb = clean((r.suburb || r.locality || r.locality_name || '').toString());

    // "SUBURB SA" 처럼 주 이름이 중복된 경우 제거
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

export function defaultEligibilityRules(): EligibilityRule[] {
  const inRange = (pc: string, a: number, b: number) => {
    const n = Number(pc);
    return n >= a && n <= b;
  };
  return [
    { when: (r) => r.state === 'NSW' && inRange(r.postcode, 2311, 2411), note: 'Eligible region (Regional Australia)' },
    { when: (r) => r.state === 'SA', note: 'Eligible region (Regional Australia)' },
    { when: (r) => r.state === 'TAS', note: 'Eligible region (Regional Australia)' },
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

export async function loadAustralianPostcodes(): Promise<PostcodeRecord[]> {
  const base = await loadAustralianPostcodesBase();
  return applyEligibility(base);
}

export async function loadPostcodesFrom(_url: string): Promise<PostcodeRecord[]> {
  throw new Error('Remote loading not configured. Use loadBundledPostcodes().');
}
