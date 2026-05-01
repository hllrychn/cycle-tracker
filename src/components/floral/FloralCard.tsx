import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
  bare?: boolean;
}

type Phase   = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type Season  = 'spring' | 'summer' | 'autumn' | 'winter';
type Filter  = 'all' | 'seasonal' | 'bouquet' | 'potted' | 'dried';

interface FloralItem {
  emoji: string;
  name: string;
  latin: string;
  reason: string;
  type: 'bouquet' | 'potted' | 'dried';
  /** Empty array = year-round */
  seasons: Season[];
  /** Hex or CSS var for the frame accent */
  frameColor: string;
}

// ── Season helpers ────────────────────────────────────────────────────────────

const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️',
};
const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter',
};

function getCurrentSeason(): Season {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function isInSeason(item: FloralItem, season: Season): boolean {
  return item.seasons.length === 0 || item.seasons.includes(season);
}

// ── Phase helpers ─────────────────────────────────────────────────────────────

function getPhase(d: number, len: number, dur: number): Phase {
  if (d <= dur)    return 'menstrual';
  if (d <= len-16) return 'follicular';
  if (d <= len-11) return 'ovulatory';
  if (d <= len)    return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const iso = todayLocalISO();
  const past = cycles.filter(c => c.start_date <= iso);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const d = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    return d >= 1 ? d : null;
  }
  if (prediction) {
    const d = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (d >= 0) return Math.max(1, prediction.avgCycleLength - d);
  }
  return null;
}

// ── Floral data ───────────────────────────────────────────────────────────────

const ALL_FLORALS: Record<Phase, { headline: string; items: FloralItem[] }> = {
  menstrual: {
    headline: 'Comfort & warmth',
    items: [
      { emoji: '🌹', name: 'Deep red roses',        latin: 'Rosa × hybrida',          type: 'bouquet', seasons: [],                   frameColor: '#9B2335', reason: 'Velvety petals and rich scent anchor you during low-energy days — choose garden roses over florist stems for maximum fragrance' },
      { emoji: '🌸', name: 'Burgundy peonies',      latin: 'Paeonia lactiflora',       type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#7B2D5E', reason: 'Lush, heavy blooms mirror the fullness of the body this phase; buy in bud and they\'ll open slowly across the week' },
      { emoji: '💜', name: 'Dark dahlias',          latin: 'Dahlia × hybrida',         type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#4A235A', reason: 'Café au lait and blackberry varieties are introspective and dramatic — perfectly suited to the inward pull of menstruation' },
      { emoji: '🌺', name: 'Burgundy snapdragons',  latin: 'Antirrhinum majus',        type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#7D1C3A', reason: 'Tall spikes of deep velvet blooms add architectural drama; snap off spent flowers to encourage new buds' },
      { emoji: '🌑', name: 'Amaranth',              latin: 'Amaranthus cruentus',      type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#6D1E3D', reason: 'Cascading wine-dark plumes evoke the deep richness of this phase; dried, they last indefinitely above a mantle' },
      { emoji: '🌿', name: 'Potted fern',           latin: 'Nephrolepis exaltata',     type: 'potted',  seasons: [],                   frameColor: '#2D6A4F', reason: 'Deeply forgiving and low-maintenance — thrives on humidity and indirect light even when you can\'t tend to it' },
      { emoji: '🌳', name: 'Potted peace lily',     latin: 'Spathiphyllum wallisii',   type: 'potted',  seasons: [],                   frameColor: '#1B4332', reason: 'Droops visibly when thirsty, perks back up after watering — a quiet mirror of the body\'s own signals this week' },
      { emoji: '🪻', name: 'Dried lavender bundle', latin: 'Lavandula angustifolia',   type: 'dried',   seasons: [],                   frameColor: '#6B4E9B', reason: 'Calming scent eases cramps and tension; tie several stems with twine and place near your pillow or bath' },
      { emoji: '🍃', name: 'Eucalyptus wreath',     latin: 'Eucalyptus cinerea',       type: 'dried',   seasons: [],                   frameColor: '#4A7C59', reason: 'Anti-inflammatory aroma supports the body; hang in a steamy bathroom to release the eucalyptol oils' },
      { emoji: '🍂', name: 'Dried poppy pods',      latin: 'Papaver somniferum',       type: 'dried',   seasons: ['autumn','winter'],   frameColor: '#8B5A2B', reason: 'Sculptural seed heads in silvery grey make moody, long-lasting arrangements — pair with dark cotton stems' },
      { emoji: '🌸', name: 'Hellebore',             latin: 'Helleborus orientalis',    type: 'bouquet', seasons: ['winter','spring'],   frameColor: '#6B2D4E', reason: 'Nodding, introspective blooms in deep burgundy and plum — sometimes called the "Lenten rose"; condition in warm water overnight before arranging' },
      { emoji: '💜', name: 'Dark anemone',           latin: 'Anemone coronaria',        type: 'bouquet', seasons: ['spring','autumn'],   frameColor: '#3D1F5A', reason: 'Jewel-toned petals in deep violet and near-black with a dramatic dark stamen; add to a dark red rose arrangement for maximum depth' },
      { emoji: '🌿', name: 'Potted snake plant',     latin: 'Sansevieria trifasciata',  type: 'potted',  seasons: [],                   frameColor: '#2A5E3F', reason: 'One of the most forgiving houseplants — tolerates neglect, low light, and infrequent watering; a reliable companion during low-energy days' },
      { emoji: '🍃', name: 'Dried magnolia leaves',  latin: 'Magnolia grandiflora',     type: 'dried',   seasons: [],                   frameColor: '#6B4A2A', reason: 'Richly tanned underside and glossy top dry beautifully; weave into a wreath or lay flat in a bowl for a moody, architectural display' },
      { emoji: '🌑', name: 'Chocolate cosmos',       latin: 'Cosmos atrosanguineus',    type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#3B1A1A', reason: 'Rare deep chocolate-burgundy blooms with a faint cocoa scent — a dramatic, unusual choice that honours the sensory depth of this phase' },
    ],
  },
  follicular: {
    headline: 'Fresh & curious',
    items: [
      { emoji: '🌸', name: 'Cherry blossom',        latin: 'Prunus serrulata',         type: 'bouquet', seasons: ['spring'],            frameColor: '#F4A7B9', reason: 'Fleeting and luminous — perfectly matched to follicular\'s sense of possibility; add pussy willow for structure and texture' },
      { emoji: '💐', name: 'White ranunculus',       latin: 'Ranunculus asiaticus',     type: 'bouquet', seasons: ['winter','spring'],   frameColor: '#B5C8D8', reason: 'Layered petals unfurling like new ideas; one of the most architecturally satisfying blooms, remarkably long-lasting in a vase' },
      { emoji: '🌼', name: 'Yellow mimosa',          latin: 'Acacia dealbata',          type: 'bouquet', seasons: ['winter','spring'],   frameColor: '#D4A017', reason: 'Feathery pom-poms radiate the cheerfulness of rising oestrogen; dry them upside-down and they\'ll keep for months' },
      { emoji: '🌷', name: 'Sweet peas',             latin: 'Lathyrus odoratus',        type: 'bouquet', seasons: ['spring'],            frameColor: '#D8A0C0', reason: 'Ruffled, intensely fragrant blooms in pastel clusters — one of the most optimistic flowers of the floral calendar' },
      { emoji: '🌼', name: 'Narcissus',              latin: 'Narcissus poeticus',       type: 'bouquet', seasons: ['spring'],            frameColor: '#E8D44D', reason: 'White petals with a tiny orange-red corona; one of the purest scents in nature and a classic sign of new beginnings' },
      { emoji: '🌱', name: 'Forced hyacinth bulb',  latin: 'Hyacinthus orientalis',    type: 'potted',  seasons: ['winter','spring'],   frameColor: '#6A5ACD', reason: 'Start one at the beginning of this phase and watch it bloom alongside you — the heady scent fills an entire room' },
      { emoji: '🪴', name: 'Trailing pothos',        latin: 'Epipremnum aureum',        type: 'potted',  seasons: [],                   frameColor: '#3A7D44', reason: 'Grows visibly between waterings; place on a high shelf and watch new leaves unfurl with your growing energy' },
      { emoji: '🌿', name: 'Monstera cutting',       latin: 'Monstera deliciosa',       type: 'potted',  seasons: [],                   frameColor: '#2D6A4F', reason: 'A single leaf in a bud vase makes a statement; propagating a cutting this phase mirrors the energy of new growth' },
      { emoji: '🌾', name: 'Dried pampas grass',    latin: 'Cortaderia selloana',      type: 'dried',   seasons: [],                   frameColor: '#C8A882', reason: 'Airy, feathered plumes bring lightness and movement — a single stem in a tall terracotta vase needs nothing else' },
      { emoji: '🌿', name: 'Dried bunny tail grass', latin: 'Lagurus ovatus',           type: 'dried',   seasons: [],                   frameColor: '#D4C5A9', reason: 'Soft, rounded seed heads are impossibly tactile; cluster several stems in a short vase for a textural cloud' },
      { emoji: '🌷', name: 'Freesia',               latin: 'Freesia × hybrida',        type: 'bouquet', seasons: ['spring'],            frameColor: '#C8A0D0', reason: 'Delicate trumpet blooms with an intensely sweet scent — one of the most uplifting fragrances in the floral calendar; buy in bud for maximum longevity' },
      { emoji: '🌼', name: 'White anemone',          latin: 'Anemone coronaria',        type: 'bouquet', seasons: ['spring'],            frameColor: '#B0C4D8', reason: '"The Bride" variety — pure white petals around a jet black stamen; crisp and energetic, perfect for the follicular sense of new beginnings' },
      { emoji: '🌱', name: 'Paperwhite narcissus',   latin: 'Narcissus papyraceus',     type: 'potted',  seasons: ['winter','spring'],   frameColor: '#E8E0A0', reason: 'Force a bulb in a pebble jar and watch roots and stems emerge in real time — a living metaphor for follicular growth and emergence' },
      { emoji: '🪴', name: 'Fittonia',               latin: 'Fittonia albivenis',       type: 'potted',  seasons: [],                   frameColor: '#C8A0B8', reason: 'Mosaic-patterned leaves in pink or white veining make it one of the most ornamental foliage plants — thrives in humidity and gentle indirect light' },
      { emoji: '🌾', name: 'Dried wheat stems',      latin: 'Triticum aestivum',        type: 'dried',   seasons: [],                   frameColor: '#D4AA60', reason: 'Warm golden spikes add structure and a gentle rustic charm; mix with white ranunculus for a harvest-meets-fresh spring aesthetic' },
    ],
  },
  ovulatory: {
    headline: 'Bold & radiant',
    items: [
      { emoji: '🌻', name: 'Sunflowers',            latin: 'Helianthus annuus',        type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#E8A020', reason: 'Face-forward and unapologetically bold; mix with lime-green chrysanthemums for a more editorial arrangement' },
      { emoji: '🌺', name: 'Garden peonies',        latin: 'Paeonia suffruticosa',     type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#E8607A', reason: 'Full, generous, and intensely fragrant at the height of their bloom — the quintessential ovulatory flower' },
      { emoji: '🌷', name: 'Parrot tulips',         latin: 'Tulipa × gesneriana',      type: 'bouquet', seasons: ['spring'],            frameColor: '#C0392B', reason: 'Flame-edged petals in electric orange and red; let them flop open in a wide-mouthed vase for dramatic effect' },
      { emoji: '🌹', name: 'Full-bloom garden rose', latin: 'Rosa × damascena',        type: 'bouquet', seasons: ['summer'],            frameColor: '#C0392B', reason: 'Intensely fragrant at peak bloom — David Austin and heirloom varieties carry the richest scent and most complex petal form' },
      { emoji: '🌸', name: 'Lisianthus',            latin: 'Eustoma grandiflorum',     type: 'bouquet', seasons: ['summer'],            frameColor: '#9B59B6', reason: 'Often mistaken for roses or peonies — ruffly, long-lasting blooms in deep purple or white that make any arrangement feel luxurious' },
      { emoji: '🌸', name: 'Protea',                latin: 'Protea cynaroides',        type: 'bouquet', seasons: [],                   frameColor: '#E05C5C', reason: 'Architectural and striking, imported year-round from South Africa; makes a bold statement and lasts two weeks in water' },
      { emoji: '🌺', name: 'Bird of paradise',      latin: 'Strelitzia reginae',       type: 'potted',  seasons: [],                   frameColor: '#E67E22', reason: 'Tropical and theatrical — a natural centrepiece that suits the social, expressive energy of ovulatory' },
      { emoji: '🌿', name: 'Potted jasmine',        latin: 'Jasminum polyanthum',      type: 'potted',  seasons: ['spring','summer'],   frameColor: '#A8D8A8', reason: 'Intoxicating night-blooming scent peaks when your pheromones and social magnetism are at their highest' },
      { emoji: '🍊', name: 'Dried citrus garland',  latin: 'Citrus sinensis',          type: 'dried',   seasons: ['winter','spring'],   frameColor: '#E67E22', reason: 'Sliced oranges or lemons dried and threaded together bring a bright, zesty accent that echoes ovulatory clarity' },
      { emoji: '🌾', name: 'Dried wildflower mix',  latin: 'Mixed species',            type: 'dried',   seasons: [],                   frameColor: '#C8A882', reason: 'A gathered bunch of dried grasses, statice and strawflowers captures the wild abundance of peak fertility' },
      { emoji: '🌺', name: 'Ginger lily',           latin: 'Hedychium coronarium',     type: 'bouquet', seasons: ['summer'],            frameColor: '#D4952A', reason: 'Intoxicating white or golden blooms with a heady tropical fragrance — known as the "butterfly ginger"; a statement stem for peak social energy' },
      { emoji: '🌸', name: 'Dendrobium orchid',      latin: 'Dendrobium nobile',        type: 'potted',  seasons: [],                   frameColor: '#C878B0', reason: 'Long-arching sprays of blooms that last 8–12 weeks; elegant and low-maintenance, suited to the confident radiance of ovulatory' },
      { emoji: '🌻', name: 'Heliconia',              latin: 'Heliconia psittacorum',    type: 'bouquet', seasons: ['summer'],            frameColor: '#E05020', reason: 'Bold tropical bracts in red and orange that last over two weeks; theatrical and attention-commanding — the visual equivalent of ovulatory confidence' },
      { emoji: '🌺', name: 'Anthurium',              latin: 'Anthurium andraeanum',     type: 'potted',  seasons: [],                   frameColor: '#C0392B', reason: 'Glossy heart-shaped spathes in lacquer red bloom repeatedly with bright indirect light; one of the boldest houseplants year-round' },
      { emoji: '🌺', name: 'Hibiscus',               latin: 'Hibiscus rosa-sinensis',   type: 'potted',  seasons: ['summer'],            frameColor: '#E83060', reason: 'Single vivid blooms each last only a day but the plant produces new flowers continuously — a perfect symbol of ovulatory abundance and renewal' },
    ],
  },
  luteal: {
    headline: 'Soft & grounding',
    items: [
      { emoji: '🪻', name: 'Lavender bundle',       latin: 'Lavandula angustifolia',   type: 'bouquet', seasons: ['summer'],            frameColor: '#7B68EE', reason: 'Shown to reduce cortisol; hang upside-down to dry and the calming effect extends for weeks after the fresh petals fade' },
      { emoji: '🌸', name: 'Blush cosmos',          latin: 'Cosmos bipinnatus',        type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#F4A7B9', reason: 'Delicate and unpretentious — soft enough for a quieter phase; they move beautifully in a breeze from an open window' },
      { emoji: '🌼', name: 'Chamomile stems',       latin: 'Matricaria chamomilla',    type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#D4A017', reason: 'Small daisy-like blooms with a honey-apple scent; dry the stems and add to your tea ritual for a double benefit' },
      { emoji: '🌼', name: 'Warm marigolds',        latin: 'Tagetes erecta',           type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#E67E22', reason: 'Earthy and grounding; traditionally used for anti-inflammatory properties, they also deter indoor insects naturally' },
      { emoji: '🌸', name: 'Dusty miller',          latin: 'Senecio cineraria',        type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#A8B8C8', reason: 'Soft silver-grey foliage acts as a natural calmer in any arrangement — beautiful filler that doesn\'t compete for attention' },
      { emoji: '🌸', name: 'Chrysanthemums',        latin: 'Chrysanthemum × morifolium', type: 'bouquet', seasons: ['autumn','winter'], frameColor: '#C8783A', reason: 'Button and spider varieties in warm terracotta and blush are deeply comforting — remarkably long-lasting cut flowers' },
      { emoji: '🌿', name: 'Potted rosemary',       latin: 'Rosmarinus officinalis',   type: 'potted',  seasons: [],                   frameColor: '#4A7C59', reason: 'Herbaceous aroma lifts brain fog; snip sprigs into a bath, diffuser or simmer pot for a grounding ritual' },
      { emoji: '🌿', name: 'Potted lavender plant', latin: 'Lavandula stoechas',       type: 'potted',  seasons: ['spring','summer'],   frameColor: '#9B7EC8', reason: 'More powerful than cut stems — a living plant on a sunny windowsill steadily releases calming compounds into the room' },
      { emoji: '🍂', name: 'Dried rose hips',       latin: 'Rosa canina',              type: 'dried',   seasons: ['autumn','winter'],   frameColor: '#A0522D', reason: 'Rich terracotta tones and gnarled texture ground the mood; arrange in a low bowl with dried seed pods and pampas' },
      { emoji: '🌾', name: 'Dried cotton stems',    latin: 'Gossypium hirsutum',       type: 'dried',   seasons: [],                   frameColor: '#D4C5A9', reason: 'Soft white bolls on woody stems bring a gentle, tactile comfort; pair with warm marigold tones for a seasonal tableau' },
      { emoji: '🌸', name: 'Japanese anemone',      latin: 'Anemone × hybrida',        type: 'bouquet', seasons: ['autumn'],            frameColor: '#D8A0B8', reason: 'Graceful pink or white flowers on wiry stems that sway in any breeze — delicate yet resilient; a fitting metaphor for the strength within stillness' },
      { emoji: '🌿', name: 'Dried sage bundle',      latin: 'Salvia officinalis',        type: 'dried',   seasons: [],                   frameColor: '#6A8A60', reason: 'Earthy, herbaceous aroma is deeply grounding; burn as a smudge stick or simmer in water to create a calming atmosphere at home' },
      { emoji: '🌼', name: 'Scabiosa',               latin: 'Scabiosa atropurpurea',    type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#8878B8', reason: 'Soft pincushion flowers in muted lavender and mauve; airy and unpretentious, they blend into any arrangement without overwhelming it' },
      { emoji: '🍂', name: 'Dried hydrangea',        latin: 'Hydrangea macrophylla',    type: 'dried',   seasons: ['autumn','winter'],   frameColor: '#A0909A', reason: 'Full mopheads dry to an antique parchment tone of dusty blue and mauve — place in a vase without water and they\'ll hold for months' },
      { emoji: '🪴', name: 'Potted mint',             latin: 'Mentha × piperita',        type: 'potted',  seasons: ['spring','summer'],   frameColor: '#5A9A6A', reason: 'Fresh menthol aroma is immediately clarifying; snip into teas, baths, or simply brush the leaves when you pass by for an instant reset' },
    ],
  },
  unknown: {
    headline: 'Flowers for every week',
    items: [
      { emoji: '🌹', name: 'Roses',                 latin: 'Rosa × hybrida',           type: 'bouquet', seasons: [],                   frameColor: '#C0392B', reason: 'A classic that holds meaning in every season — choose garden roses for fragrance and longevity over florist stems' },
      { emoji: '🌸', name: 'Peonies',               latin: 'Paeonia lactiflora',       type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#E8607A', reason: 'Full-bodied and fragrant; one of the most universally beloved flowers across all four phases' },
      { emoji: '🌻', name: 'Sunflowers',            latin: 'Helianthus annuus',        type: 'bouquet', seasons: ['summer','autumn'],   frameColor: '#E8A020', reason: 'Cheerful and long-lasting — easy brightness without maintenance or upkeep' },
      { emoji: '🌷', name: 'Tulips',                latin: 'Tulipa gesneriana',        type: 'bouquet', seasons: ['spring'],            frameColor: '#E05C5C', reason: 'Fresh and affordable; bring seasonal energy and structural elegance to any week of the month' },
      { emoji: '🌹', name: 'Carnations',            latin: 'Dianthus caryophyllus',    type: 'bouquet', seasons: [],                   frameColor: '#D88080', reason: 'Underrated and long-lasting — spicy-sweet scent and ruffled blooms work in every arrangement style' },
      { emoji: '🪻', name: 'Lavender',              type: 'dried',   latin: 'Lavandula angustifolia',   seasons: [],                   frameColor: '#7B68EE', reason: 'Calming scent works fresh or dried; ties beautifully as a bunch and doubles as a sleep sachet beside the bed' },
      { emoji: '🌿', name: 'Eucalyptus',            latin: 'Eucalyptus cinerea',       type: 'dried',   seasons: [],                   frameColor: '#4A7C59', reason: 'Adds texture and a clean, restorative aroma to any arrangement; lasts weeks without water' },
      { emoji: '🌾', name: 'Dried grasses',         latin: 'Mixed Poaceae',            type: 'dried',   seasons: [],                   frameColor: '#C8A882', reason: 'Oat grass, wheat and barley stems lend an earthy, organic quality — inexpensive and endlessly versatile' },
      { emoji: '🪴', name: 'Pothos',                latin: 'Epipremnum aureum',        type: 'potted',  seasons: [],                   frameColor: '#3A7D44', reason: 'Nearly indestructible — thrives in low light and irregular watering, growing steadily alongside you' },
      { emoji: '🌿', name: 'Peace lily',            latin: 'Spathiphyllum wallisii',   type: 'potted',  seasons: [],                   frameColor: '#1B4332', reason: 'One of the best air-purifying houseplants; elegant white spathes bloom periodically without much care' },
      { emoji: '🌸', name: 'Alstroemeria',          latin: 'Alstroemeria hybrida',     type: 'bouquet', seasons: [],                   frameColor: '#E07878', reason: 'Incredibly long-lasting cut flower — up to three weeks in a vase; speckled trumpet blooms in warm pinks and oranges that suit any arrangement' },
      { emoji: '🌼', name: 'Statice',               latin: 'Limonium sinuatum',        type: 'dried',   seasons: [],                   frameColor: '#9090C8', reason: 'Papery lilac and white blooms that dry in the vase without any intervention — an honest, unpretentious filler that holds colour for months' },
      { emoji: '🌿', name: 'Air plant',              latin: 'Tillandsia spp.',          type: 'potted',  seasons: [],                   frameColor: '#60A870', reason: 'Needs no soil — mist twice a week and place anywhere with bright indirect light; sculptural and almost impossibly easy to maintain' },
      { emoji: '🌷', name: 'Freesia',               latin: 'Freesia × hybrida',        type: 'bouquet', seasons: ['spring','summer'],   frameColor: '#C8A0D0', reason: 'One of the most beloved florist stems — sweet scent, pastel palette, and a week or more of vase life; a reliable mood-lifter any week of the cycle' },
      { emoji: '🌿', name: 'Boston fern',            latin: 'Nephrolepis exaltata',     type: 'potted',  seasons: [],                   frameColor: '#2D7A50', reason: 'Lush arching fronds soften any corner; thrives in humidity and moderate light — a natural air humidifier and one of the most beautiful foliage plants' },
    ],
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const PHASE_STYLE: Record<Phase, { fill: string; accent: string; label: string; text: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  accent: 'var(--color-peat-deep)', label: 'Menstrual',  text: 'var(--color-text-primary)' },
  follicular: { fill: 'var(--color-phase-follicular)', accent: 'var(--color-blue-base)', label: 'Follicular', text: 'var(--color-blue-dark)'    },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  accent: 'var(--color-moss-base)', label: 'Ovulatory',  text: 'var(--color-moss-dark)'    },
  luteal:     { fill: 'var(--color-phase-luteal)',     accent: 'var(--color-peat-deep)', label: 'Luteal',     text: 'var(--color-peat-deep)'    },
  unknown:    { fill: '#FFFFFF',                       accent: 'var(--color-moss-base)', label: '',           text: 'var(--color-peat-deep)'    },
};

const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const TYPE_COLOR: Record<'bouquet' | 'potted' | 'dried', { bg: string; border: string; text: string; dot: string }> = {
  bouquet: { bg: 'var(--color-moss-light)',   border: 'var(--color-moss-base)',  text: 'var(--color-moss-dark)',   dot: 'var(--color-moss-base)'  },
  potted:  { bg: 'var(--color-blue-light)',   border: 'var(--color-blue-base)',  text: 'var(--color-blue-dark)',   dot: 'var(--color-blue-base)'  },
  dried:   { bg: 'var(--color-accent-light)', border: 'var(--color-accent)',     text: 'var(--color-accent-dark)', dot: 'var(--color-accent)'     },
};

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', seasonal: 'In season', bouquet: 'Bouquet', potted: 'Potted', dried: 'Dried',
};

// ── Flower frame ──────────────────────────────────────────────────────────────

function FlowerFrame({ item }: { item: FloralItem }) {
  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Outer mat / mount */}
      <div style={{
        width: 96, height: 96,
        borderRadius: 12,
        padding: 5,
        background: '#F8F5F0',
        boxShadow: `0 2px 12px ${item.frameColor}44, 0 0 0 1px ${item.frameColor}33`,
      }}>
        {/* Inner frame */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 8,
          background: `linear-gradient(135deg, ${item.frameColor}22 0%, ${item.frameColor}08 100%)`,
          border: `1.5px solid ${item.frameColor}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 46,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Corner dots — botanical print motif */}
          {[['2px','2px'],['auto','2px'],['2px','auto'],['auto','auto']].map(([t,l], i) => (
            <span key={i} style={{
              position: 'absolute',
              top: t === 'auto' ? undefined : t,
              bottom: t === 'auto' ? '2px' : undefined,
              left: l === 'auto' ? undefined : l,
              right: l === 'auto' ? '2px' : undefined,
              width: 4, height: 4, borderRadius: '50%',
              background: item.frameColor, opacity: 0.3,
            }} />
          ))}
          {item.emoji}
        </div>
      </div>
      {/* Caption strip */}
      <p style={{
        fontSize: 9, fontStyle: 'italic', textAlign: 'center',
        color: item.frameColor, opacity: 0.8,
        maxWidth: 96, lineHeight: 1.3,
      }}>
        {item.latin}
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloralCard({ cycles, prediction, bare = false }: Props) {
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const cycleDay   = getCurrentCycleDay(cycles, prediction);
  const todayPhase: Phase = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [filter, setFilter]       = useState<Filter>('all');
  const [selected, setSelected]   = useState<string | null>(null);

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;
  const currentSeason = getCurrentSeason();

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
    setSelected(null);
  };

  const style = PHASE_STYLE[activePhase];
  const { headline, items } = ALL_FLORALS[activePhase];

  const sortedItems = [...items].sort((a, b) =>
    (isInSeason(a, currentSeason) ? 0 : 1) - (isInSeason(b, currentSeason) ? 0 : 1)
  );

  const countOf = (f: Filter) => {
    if (f === 'all')      return sortedItems.length;
    if (f === 'seasonal') return sortedItems.filter(i => isInSeason(i, currentSeason)).length;
    return sortedItems.filter(i => i.type === f).length;
  };

  const visible = filter === 'all'      ? sortedItems
    : filter === 'seasonal' ? sortedItems.filter(i => isInSeason(i, currentSeason))
    : sortedItems.filter(i => i.type === filter);

  const selectedItem = selected ? items.find(i => i.name === selected) ?? null : null;
  const handlePill = (name: string) => setSelected(prev => prev === name ? null : name);

  const inner = (
    <>
      {/* Header */}
      <div className={`px-5 flex items-center justify-between ${bare ? 'pt-3 pb-3' : 'pt-5 pb-4'}`} style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Floral arrangements</p>
          {activePhase !== 'unknown' && (
            <p className="text-xs mt-0.5" style={{ color: style.text }}>{headline}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canNavigate && !isToday && (
            <button onClick={() => { setViewPhase(null); setSelected(null); }}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}>
              ↩ Today
            </button>
          )}
          {activePhase !== 'unknown' && (
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: style.fill, color: style.text }}>
              {style.label}
            </span>
          )}
          {canNavigate && (
            <div className="flex items-center gap-0.5">
              <button onClick={() => goToPhase(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>‹</button>
              <button onClick={() => goToPhase(1)}  className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>›</button>
            </div>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-ovulation)' }}>🌸</div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="px-5 py-2.5 flex items-center gap-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        {(['all', 'seasonal', 'bouquet', 'potted', 'dried'] as Filter[]).map(f => {
          const active     = filter === f;
          const count      = countOf(f);
          const isSeasonal = f === 'seasonal';
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={active
                ? isSeasonal
                  ? { background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)', border: '1px solid var(--color-moss-base)' }
                  : f !== 'all'
                    ? { background: TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].bg, color: TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].text, border: `1px solid ${TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].border}` }
                    : { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', border: '1px solid var(--color-peat-dark)' }
                : { background: 'transparent', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              {isSeasonal && `${SEASON_EMOJI[currentSeason]} `}{FILTER_LABELS[f]}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
        {selected && (
          <button onClick={() => setSelected(null)} className="ml-auto text-xs" style={{ color: 'var(--color-peat-mid)' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Pill grid */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {visible.map(item => {
          const isSelected = selected === item.name;
          const inSeason   = isInSeason(item, currentSeason);
          const c = TYPE_COLOR[item.type];
          return (
            <button
              key={item.name}
              onClick={() => handlePill(item.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
              style={isSelected
                ? { background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, fontWeight: 600 }
                : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              <span className="leading-none">{item.emoji}</span>
              {item.name}
              {inSeason && (
                <span className="leading-none text-xs" title={`In season: ${SEASON_LABEL[currentSeason]}`}>
                  {SEASON_EMOJI[currentSeason]}
                </span>
              )}
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
            </button>
          );
        })}
      </div>

      {/* Expanded detail with flower frame */}
      {selectedItem && (() => {
        const inSeason   = isInSeason(selectedItem, currentSeason);
        const seasonNote = selectedItem.seasons.length === 0
          ? 'Available year-round'
          : `Best in: ${selectedItem.seasons.map(s => `${SEASON_EMOJI[s]} ${SEASON_LABEL[s]}`).join(' · ')}`;
        const c = TYPE_COLOR[selectedItem.type];
        return (
          <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
            {/* Frame + info row */}
            <div className="flex gap-3 p-3" style={{ background: c.bg }}>
              <FlowerFrame item={selectedItem} />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold leading-tight" style={{ color: c.text }}>
                      {selectedItem.name}
                    </span>
                    {inSeason && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)', border: '1px solid var(--color-moss-base)' }}
                      >
                        {SEASON_EMOJI[currentSeason]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
                    {selectedItem.reason}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.06)', color: c.text }}
                  >
                    {FILTER_LABELS[selectedItem.type]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>{seasonNote}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div className={`px-5 ${bare ? 'py-2' : 'py-3'}`} style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {activePhase === 'unknown'
            ? 'Log a period to see floral ideas tailored to your current cycle phase.'
            : 'Tap any flower to see care notes · Availability varies by region.'}
        </p>
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.accent}` }}>
      {inner}
    </div>
  );
}
