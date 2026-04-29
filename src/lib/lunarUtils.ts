export type BiodynamicDayType = 'Root' | 'Flower' | 'Fruit' | 'Leaf';

export interface LunarDay {
  moonAge:      number;           // 0–29.53 days
  phaseEmoji:   string;
  phaseName:    string;
  zodiacSign:   string;
  dayType:      BiodynamicDayType;
  dayTypeEmoji: string;
  dayTypeColor: string;
}

// ── Moon phase ──────────────────────────────────────────────────────────────

const SYNODIC_PERIOD  = 29.530588853;                          // days
const KNOWN_NEW_MOON  = Date.UTC(2000, 0, 6, 18, 14, 0);      // Jan 6 2000 18:14 UTC

export function getMoonAge(date: Date): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  return ((days % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;
}

export function moonPhase(age: number): { emoji: string; name: string } {
  if (age <  1.85) return { emoji: '🌑', name: 'New Moon' };
  if (age <  7.38) return { emoji: '🌒', name: 'Waxing Crescent' };
  if (age <  9.22) return { emoji: '🌓', name: 'First Quarter' };
  if (age < 14.77) return { emoji: '🌔', name: 'Waxing Gibbous' };
  if (age < 16.61) return { emoji: '🌕', name: 'Full Moon' };
  if (age < 22.15) return { emoji: '🌖', name: 'Waning Gibbous' };
  if (age < 23.99) return { emoji: '🌗', name: 'Last Quarter' };
  return             { emoji: '🌘', name: 'Waning Crescent' };
}

// ── Moon zodiac position (Meeus simplified, accurate ~1–2°) ─────────────────

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
const toRad = (d: number) => ((d % 360 + 360) % 360) * Math.PI / 180;

function moonLongitude(date: Date): number {
  const D = (date.getTime() - J2000) / 86_400_000;

  const L    = 218.316 + 13.176396 * D;   // moon mean longitude
  const M    = 134.963 + 13.064993 * D;   // moon mean anomaly
  const Ms   = 357.529 +  0.985600 * D;   // sun  mean anomaly
  const Elong = L - (280.459 + 0.985600 * D); // elongation

  const λ = L
    + 6.289 * Math.sin(toRad(M))
    + 1.274 * Math.sin(toRad(2 * Elong - M))
    - 0.658 * Math.sin(toRad(2 * Elong))
    - 0.186 * Math.sin(toRad(Ms))
    - 0.059 * Math.sin(toRad(2 * M - 2 * Elong))
    - 0.057 * Math.sin(toRad(M - 2 * Elong + Ms))
    + 0.053 * Math.sin(toRad(M + 2 * Elong))
    + 0.046 * Math.sin(toRad(2 * Elong - Ms))
    + 0.041 * Math.sin(toRad(M - Ms));

  return ((λ % 360) + 360) % 360;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

// ── Biodynamic day type ──────────────────────────────────────────────────────
// Fire  signs → Fruit   | Earth signs → Root
// Air   signs → Flower  | Water signs → Leaf

const DAY_TYPE: Record<string, BiodynamicDayType> = {
  Aries: 'Fruit',   Leo: 'Fruit',   Sagittarius: 'Fruit',
  Taurus: 'Root',   Virgo: 'Root',  Capricorn: 'Root',
  Gemini: 'Flower', Libra: 'Flower', Aquarius: 'Flower',
  Cancer: 'Leaf',   Scorpio: 'Leaf', Pisces: 'Leaf',
};

export const DAY_TYPE_EMOJI: Record<BiodynamicDayType, string> = {
  Root:   '🌱',
  Flower: '🌸',
  Fruit:  '🍎',
  Leaf:   '🍃',
};

export const DAY_TYPE_COLOR: Record<BiodynamicDayType, string> = {
  Root:   '#8B7355',
  Flower: '#C084A0',
  Fruit:  '#D4824A',
  Leaf:   '#5B8C6E',
};

// ── Main export ──────────────────────────────────────────────────────────────

export function getLunarDay(date: Date): LunarDay {
  const age       = getMoonAge(date);
  const { emoji: phaseEmoji, name: phaseName } = moonPhase(age);

  const lon        = moonLongitude(date);
  const zodiacSign = ZODIAC_SIGNS[Math.floor(lon / 30)];
  const dayType    = DAY_TYPE[zodiacSign];

  return {
    moonAge:      age,
    phaseEmoji,
    phaseName,
    zodiacSign,
    dayType,
    dayTypeEmoji: DAY_TYPE_EMOJI[dayType],
    dayTypeColor: DAY_TYPE_COLOR[dayType],
  };
}
