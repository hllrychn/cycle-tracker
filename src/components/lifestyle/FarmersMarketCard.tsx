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
type Filter  = 'all' | 'seasonal' | 'fruit' | 'vegetable' | 'herb';

interface ProduceItem {
  emoji: string;
  name: string;
  latin: string;
  /** Short nutrient/property callout shown as a tag */
  benefit: string;
  type: 'fruit' | 'vegetable' | 'herb';
  /** Empty = year-round */
  seasons: Season[];
  frameColor: string;
  reason: string;
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
function isInSeason(item: ProduceItem, season: Season): boolean {
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

// ── Produce data ──────────────────────────────────────────────────────────────

const ALL_PRODUCE: Record<Phase, { headline: string; items: ProduceItem[] }> = {
  menstrual: {
    headline: 'Replenishing & warming',
    items: [
      { emoji: '🫐', name: 'Beets',            latin: 'Beta vulgaris',           benefit: 'Iron · Folate',     type: 'vegetable', seasons: ['autumn','winter'],          frameColor: '#8B2252', reason: 'Rich in iron to replenish blood loss and folate to support cell renewal; roast with olive oil to bring out natural sweetness, or juice raw with apple and ginger' },
      { emoji: '🥬', name: 'Kale',             latin: 'Brassica oleracea',       benefit: 'Iron · Calcium',    type: 'vegetable', seasons: ['autumn','winter','spring'],  frameColor: '#2D6A2F', reason: 'One of the highest plant sources of calcium and iron — massage raw leaves with lemon juice and olive oil to break down bitterness and improve digestibility' },
      { emoji: '🌿', name: 'Spinach',          latin: 'Spinacia oleracea',       benefit: 'Iron · Magnesium',  type: 'leafy' as 'vegetable', seasons: ['spring','autumn'],           frameColor: '#3A7D44', reason: 'Non-haem iron absorbs better when paired with vitamin C; wilt quickly in a pan with garlic, a squeeze of lemon, and a pinch of chilli' },
      { emoji: '🍠', name: 'Sweet potato',     latin: 'Ipomoea batatas',         benefit: 'B6 · Magnesium',    type: 'vegetable', seasons: ['autumn','winter'],          frameColor: '#C06020', reason: 'B6 helps ease cramping and mood shifts; magnesium supports muscle relaxation — bake whole for a comforting, fibre-rich meal base' },
      { emoji: '🌿', name: 'Fennel',           latin: 'Foeniculum vulgare',      benefit: 'Anti-cramp',        type: 'vegetable', seasons: ['autumn','winter','spring'],  frameColor: '#70A870', reason: 'Anethole compounds have been shown to reduce menstrual cramping; slice thinly for salad, braise slowly until caramelised, or steep seeds as a tea' },
      { emoji: '🟠', name: 'Ginger root',      latin: 'Zingiber officinale',     benefit: 'Anti-inflammatory', type: 'herb',      seasons: [],                           frameColor: '#C07838', reason: 'Shown in studies to reduce period pain as effectively as ibuprofen when taken at the onset of cramping; grate fresh into hot water with honey and lemon' },
      { emoji: '🍒', name: 'Dark cherries',    latin: 'Prunus avium',            benefit: 'Anthocyanins',      type: 'fruit',     seasons: ['summer'],                   frameColor: '#8B1A1A', reason: 'Anthocyanins are among the most potent anti-inflammatory compounds in food; tart cherry juice concentrate is effective for pain and sleep quality' },
      { emoji: '🫀', name: 'Pomegranate',      latin: 'Punica granatum',         benefit: 'Iron · Antioxidants', type: 'fruit',   seasons: ['autumn','winter'],          frameColor: '#9B1C3A', reason: 'Seeds contain iron, folate, and punicalagins — powerful antioxidants; scatter over warm porridge, yoghurt, or a dark leafy green salad' },
      { emoji: '🥬', name: 'Swiss chard',      latin: 'Beta vulgaris subsp.',    benefit: 'Iron · K',          type: 'vegetable', seasons: [],                           frameColor: '#6B2D4A', reason: 'Rainbow chard provides iron, vitamin K, and magnesium in one vegetable — sauté stalks first as they take longer, then add the leaves for a minute more' },
      { emoji: '🌿', name: 'Parsley',          latin: 'Petroselinum crispum',    benefit: 'Iron · Vitamin C',  type: 'herb',      seasons: [],                           frameColor: '#4A7C45', reason: 'Flat-leaf parsley is surprisingly high in iron and the vitamin C content enhances absorption; blend into a gremolata or chimichurri over warm lentils' },
      { emoji: '🎃', name: 'Butternut squash', latin: 'Cucurbita moschata',      benefit: 'B6 · Magnesium',    type: 'vegetable', seasons: ['autumn','winter'],          frameColor: '#D4782A', reason: 'B6 is a key cofactor in serotonin production; roast cubes in batches and add to soups, curries, or warm grain bowls throughout the week' },
      { emoji: '🫐', name: 'Cranberries',      latin: 'Vaccinium macrocarpon',   benefit: 'Antioxidants',      type: 'fruit',     seasons: ['autumn'],                   frameColor: '#C0204A', reason: 'Proanthocyanidins reduce inflammation; fresh or frozen, add to overnight oats, blend into smoothies, or simmer into a simple sauce with orange zest' },
    ],
  },
  follicular: {
    headline: 'Estrogen-supporting & fresh',
    items: [
      { emoji: '🌿', name: 'Asparagus',        latin: 'Asparagus officinalis',   benefit: 'Folate · Prebiotic', type: 'vegetable', seasons: ['spring'],                  frameColor: '#6A9A5A', reason: 'Folate supports cell division during the follicular phase; prebiotic inulin feeds gut bacteria that metabolise oestrogen — roast spears at high heat for 10 minutes' },
      { emoji: '🫛', name: 'Peas',             latin: 'Pisum sativum',           benefit: 'Folate · Protein',   type: 'vegetable', seasons: ['spring','summer'],         frameColor: '#4A8A4A', reason: 'Fresh or podded peas are a rare combination of plant protein, folate, and phytoestrogens — eat raw in salads or barely blanched to preserve nutrients' },
      { emoji: '🌿', name: 'Watercress',       latin: 'Nasturtium officinale',   benefit: 'DIM · Iron',         type: 'herb',      seasons: ['spring','autumn'],         frameColor: '#3A6A3A', reason: 'DIM (diindolylmethane) helps the liver metabolise excess oestrogen; the most nutrient-dense leafy green per calorie — wilt in warm pasta or blend into pesto' },
      { emoji: '🫑', name: 'Artichoke',        latin: 'Cynara cardunculus',      benefit: 'Liver support',      type: 'vegetable', seasons: ['spring','summer'],         frameColor: '#7A9A6A', reason: 'Cynarin and silymarin support liver function, which is central to healthy oestrogen metabolism; steam whole and serve with a lemon-butter dipping sauce' },
      { emoji: '🌿', name: 'Radishes',         latin: 'Raphanus sativus',        benefit: 'DIM · Vitamin C',    type: 'vegetable', seasons: ['spring','summer'],         frameColor: '#C04060', reason: 'Cruciferous DIM content aids oestrogen clearance; watermelon radish adds a dramatic pink interior to salads — slice paper-thin with a mandoline' },
      { emoji: '🍓', name: 'Strawberries',     latin: 'Fragaria × ananassa',     benefit: 'Vitamin C · Folate', type: 'fruit',     seasons: ['spring','summer'],         frameColor: '#E03060', reason: 'Vitamin C enhances iron absorption and supports collagen synthesis; the folate content supports the egg maturation happening during this phase' },
      { emoji: '🥦', name: 'Broccoli',         latin: 'Brassica oleracea',       benefit: 'DIM · Folate',       type: 'vegetable', seasons: ['spring','autumn'],         frameColor: '#3A6A4A', reason: 'One of the highest DIM sources in the vegetable kingdom; lightly steam rather than boil to preserve sulforaphane, then finish with olive oil and lemon' },
      { emoji: '🌿', name: 'Spring onions',    latin: 'Allium fistulosum',       benefit: 'Quercetin · Prebiotic', type: 'vegetable', seasons: ['spring','summer'],      frameColor: '#6A9A50', reason: 'Quercetin is a natural anti-inflammatory; the prebiotic fibre feeds the gut bacteria responsible for oestrogen recycling — use raw as a garnish' },
      { emoji: '🥔', name: 'New potatoes',     latin: 'Solanum tuberosum',       benefit: 'B6 · Potassium',     type: 'vegetable', seasons: ['spring','summer'],         frameColor: '#D4B86A', reason: 'New season potatoes are lower in starch and higher in B6 than their stored counterparts; boil in salted water and dress while warm with olive oil and herbs' },
      { emoji: '🍑', name: 'Apricots',         latin: 'Prunus armeniaca',        benefit: 'Folate · Beta-carotene', type: 'fruit', seasons: ['spring','summer'],        frameColor: '#E09040', reason: 'Beta-carotene is a precursor to vitamin A, which supports follicle maturation; fresh apricots are far superior to dried — eat within a few days of purchase' },
      { emoji: '🫚', name: 'Flaxseeds',        latin: 'Linum usitatissimum',     benefit: 'Lignans · Omega-3',  type: 'herb',      seasons: [],                          frameColor: '#C8A870', reason: 'Lignans are phytoestrogens that gently modulate oestrogen signalling; grind fresh and add to smoothies, yoghurt, or porridge — whole seeds pass undigested' },
      { emoji: '🥗', name: 'Snap peas',        latin: 'Pisum sativum var.',      benefit: 'Folate · Fibre',     type: 'vegetable', seasons: ['spring','summer'],         frameColor: '#5A8A50', reason: 'A satisfying crunchy source of folate and gut-supportive fibre; eat raw as a snack or stir-fry at high heat for 90 seconds to keep the snap' },
    ],
  },
  ovulatory: {
    headline: 'Antioxidant-rich & vibrant',
    items: [
      { emoji: '🍅', name: 'Tomatoes',         latin: 'Solanum lycopersicum',    benefit: 'Lycopene · Vitamin C', type: 'fruit',   seasons: ['summer'],                  frameColor: '#C03020', reason: 'Lycopene is a potent antioxidant that supports egg quality; lycopene bioavailability increases dramatically when tomatoes are cooked in olive oil' },
      { emoji: '🫑', name: 'Bell peppers',     latin: 'Capsicum annuum',         benefit: 'Vitamin C · Folate',   type: 'vegetable', seasons: ['summer'],               frameColor: '#E04020', reason: 'The highest vitamin C content of any common vegetable; vitamin C supports the luteinising hormone (LH) surge that triggers ovulation — eat raw to maximise C' },
      { emoji: '🫐', name: 'Blueberries',      latin: 'Vaccinium corymbosum',    benefit: 'Antioxidants',         type: 'fruit',   seasons: ['summer'],                  frameColor: '#3A4A9A', reason: 'Anthocyanins protect developing eggs from oxidative stress; a handful daily during ovulatory phase is one of the most well-researched fertility-supportive habits' },
      { emoji: '🍑', name: 'Peaches',          latin: 'Prunus persica',          benefit: 'Vitamin C · Beta-carotene', type: 'fruit', seasons: ['summer'],             frameColor: '#E07840', reason: 'Beta-carotene directly supports progesterone production in the corpus luteum after ovulation; eat perfectly ripe — the scent is the best indicator' },
      { emoji: '🍉', name: 'Watermelon',       latin: 'Citrullus lanatus',       benefit: 'Lycopene · Hydration', type: 'fruit',   seasons: ['summer'],                  frameColor: '#E03050', reason: 'High lycopene content and 92% water — peak oestrogen increases metabolic rate and water needs; the seeds are edible and high in zinc and magnesium' },
      { emoji: '🌽', name: 'Corn',             latin: 'Zea mays',                benefit: 'B vitamins · Zinc',    type: 'vegetable', seasons: ['summer'],               frameColor: '#E0C020', reason: 'B vitamins support energy production at your most energetic phase; eat fresh corn within 24 hours of purchase — sweetness converts to starch rapidly' },
      { emoji: '🍆', name: 'Aubergine',        latin: 'Solanum melongena',       benefit: 'Nasunin · Antioxidants', type: 'vegetable', seasons: ['summer'],             frameColor: '#4A2060', reason: 'Nasunin, found in the purple skin, scavenges free radicals and protects cell membranes; roast or char over a flame and dress with tahini and pomegranate' },
      { emoji: '🍇', name: 'Raspberries',      latin: 'Rubus idaeus',            benefit: 'Zinc · Vitamin C',     type: 'fruit',   seasons: ['summer'],                  frameColor: '#C04080', reason: 'Zinc is critical for ovulation and fertilisation; raspberry leaf is traditionally used to tone the uterus — fresh or frozen, a daily bowl is worth the habit' },
      { emoji: '🫚', name: 'Figs',             latin: 'Ficus carica',            benefit: 'Calcium · Iron',       type: 'fruit',   seasons: ['summer','autumn'],         frameColor: '#7A4A6A', reason: 'Fresh figs are among the best plant sources of calcium and iron, with a naturally sweet intensity — pair with a good cheese and a drizzle of honey' },
      { emoji: '🥒', name: 'Courgette',        latin: 'Cucurbita pepo',          benefit: 'Zinc · B6',            type: 'vegetable', seasons: ['summer'],               frameColor: '#5A8A40', reason: 'Zinc and B6 both support the LH surge; shave raw into ribbons for a fresh salad, or char on a griddle pan with olive oil and fresh mint' },
      { emoji: '🍒', name: 'Plums',            latin: 'Prunus domestica',        benefit: 'Vitamin C · Fibre',    type: 'fruit',   seasons: ['summer','autumn'],         frameColor: '#5A2060', reason: 'Fibre supports the gut bacteria responsible for clearing used oestrogens; eat skin-on for the anthocyanin content concentrated just beneath the surface' },
      { emoji: '🍓', name: 'Blackberries',     latin: 'Rubus fruticosus',        benefit: 'Vitamin C · Manganese', type: 'fruit',  seasons: ['summer','autumn'],         frameColor: '#2A1060', reason: 'Manganese supports bone density alongside peak oestrogen levels; wild-foraged blackberries have markedly higher antioxidant content than cultivated varieties' },
    ],
  },
  luteal: {
    headline: 'Grounding & progesterone-supportive',
    items: [
      { emoji: '🎃', name: 'Pumpkin',          latin: 'Cucurbita maxima',        benefit: 'Magnesium · Zinc',    type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#C06020', reason: 'Zinc supports the corpus luteum in producing progesterone; magnesium reduces PMS symptoms significantly — roast the seeds alongside the flesh for a double benefit' },
      { emoji: '🥦', name: 'Brussels sprouts', latin: 'Brassica oleracea',       benefit: 'B6 · DIM',            type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#4A7A3A', reason: 'B6 directly supports progesterone production and helps regulate mood; DIM assists oestrogen clearance to keep the oestrogen:progesterone balance in check' },
      { emoji: '🥬', name: 'Leeks',            latin: 'Allium porrum',           benefit: 'B6 · Prebiotic',      type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#78A868', reason: 'Excellent B6 source to support progesterone synthesis; prebiotic inulin feeds the gut microbiome, which regulates mood neurotransmitters during the luteal phase' },
      { emoji: '🍎', name: 'Apples',           latin: 'Malus domestica',         benefit: 'Quercetin · Fibre',   type: 'fruit',     seasons: ['autumn'],                  frameColor: '#C03020', reason: 'Quercetin is anti-inflammatory and quercetin-rich foods are associated with reduced PMS; the pectin fibre helps clear excess oestrogens through the digestive tract' },
      { emoji: '🍐', name: 'Pears',            latin: 'Pyrus communis',          benefit: 'Fibre · Boron',       type: 'fruit',     seasons: ['autumn','winter'],         frameColor: '#8A9A50', reason: 'Boron helps maintain progesterone levels during the second half of the cycle; choose varieties with skin-on for maximum polyphenol content' },
      { emoji: '🍠', name: 'Sweet potato',     latin: 'Ipomoea batatas',         benefit: 'B6 · Magnesium',      type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#C06020', reason: 'One of the most B6-dense whole foods; baking concentrates the natural sugars while keeping the glycaemic index lower than standard potato — ideal for the cravings this phase brings' },
      { emoji: '🥦', name: 'Cauliflower',      latin: 'Brassica oleracea',       benefit: 'Choline · DIM',       type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#D4C8A0', reason: 'Choline is critical for neurotransmitter synthesis and mood regulation; roast cauliflower until deeply caramelised — the flavour is entirely transformed by browning' },
      { emoji: '🍄', name: 'Mushrooms',        latin: 'Agaricus bisporus',       benefit: 'Vitamin D · B vitamins', type: 'vegetable', seasons: [],                     frameColor: '#8A7060', reason: 'The only non-animal food source of vitamin D — important for progesterone receptor function; expose fresh mushrooms gills-up to midday sun for 15 minutes to double the D content' },
      { emoji: '🌿', name: 'Parsnips',         latin: 'Pastinaca sativa',        benefit: 'B6 · Folate',         type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#D4C880', reason: 'B6 and folate work together in progesterone metabolism; parsnips improve dramatically after the first frost — roast with honey and thyme for a sweet, earthy side' },
      { emoji: '🥬', name: 'Savoy cabbage',    latin: 'Brassica oleracea',       benefit: 'Magnesium · DIM',     type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#608A60', reason: 'Magnesium is the most commonly deficient mineral in PMS and the most effective supplement for reducing symptoms; braise slowly with caraway seeds and a splash of cider vinegar' },
      { emoji: '🍊', name: 'Persimmon',        latin: 'Diospyros kaki',          benefit: 'Vitamin A · Fibre',   type: 'fruit',     seasons: ['autumn','winter'],         frameColor: '#E07020', reason: 'Vitamin A supports progesterone production; eat the Hachiya variety when deeply soft and jammy, or slice the Fuyu firm like an apple — both are exceptional' },
      { emoji: '🌰', name: 'Chestnuts',        latin: 'Castanea sativa',         benefit: 'B6 · Magnesium',      type: 'fruit',     seasons: ['autumn','winter'],         frameColor: '#8A5030', reason: 'The only nut that is primarily starchy — a deeply satisfying, low-fat source of B6 and magnesium for progesterone support; roast over an open flame and peel while warm' },
    ],
  },
  unknown: {
    headline: 'Year-round farmers market finds',
    items: [
      { emoji: '🥬', name: 'Kale',             latin: 'Brassica oleracea',       benefit: 'Iron · Calcium',      type: 'vegetable', seasons: [],                          frameColor: '#2D6A2F', reason: 'Available year-round at most markets and consistently one of the most nutrient-dense greens — massage with lemon and olive oil to use raw, or wilt quickly with garlic' },
      { emoji: '🍅', name: 'Tomatoes',         latin: 'Solanum lycopersicum',    benefit: 'Lycopene · Vitamin C', type: 'fruit',    seasons: ['summer'],                  frameColor: '#C03020', reason: 'Peak season summer tomatoes are incomparably superior; buy locally grown, vine-ripe, and avoid refrigerating — cold destroys both flavour and lycopene bioavailability' },
      { emoji: '🌿', name: 'Ginger root',      latin: 'Zingiber officinale',     benefit: 'Anti-inflammatory',   type: 'herb',      seasons: [],                          frameColor: '#C07838', reason: 'Anti-inflammatory and warming across all phases; one of the most versatile roots in the kitchen — keep a knob in the freezer and grate directly from frozen' },
      { emoji: '🥦', name: 'Broccoli',         latin: 'Brassica oleracea',       benefit: 'DIM · Folate',        type: 'vegetable', seasons: ['spring','autumn'],         frameColor: '#3A6A4A', reason: 'DIM content makes broccoli one of the most hormone-balancing vegetables available; roast until the edges char and the florets caramelise — far superior to steaming' },
      { emoji: '🍠', name: 'Sweet potato',     latin: 'Ipomoea batatas',         benefit: 'B6 · Magnesium',      type: 'vegetable', seasons: ['autumn','winter'],         frameColor: '#C06020', reason: 'A whole-food source of B6 and magnesium, both critical for hormone balance; widely available, affordable, and one of the most nutritionally complete root vegetables' },
      { emoji: '🍄', name: 'Mushrooms',        latin: 'Agaricus bisporus',       benefit: 'Vitamin D · B vitamins', type: 'vegetable', seasons: [],                     frameColor: '#8A7060', reason: 'The only plant-based vitamin D source — important for hormonal signalling across all cycle phases; available year-round and worth buying from a specialist market vendor' },
      { emoji: '🌿', name: 'Herbs (mixed)',     latin: 'Various species',         benefit: 'Antioxidants',        type: 'herb',      seasons: [],                          frameColor: '#4A7C45', reason: 'Fresh herbs from a market — parsley, basil, mint, dill — contain concentrated antioxidants and micronutrients; a small bunch transforms any meal and costs very little' },
      { emoji: '🧅', name: 'Garlic',           latin: 'Allium sativum',          benefit: 'Allicin · Prebiotic', type: 'vegetable', seasons: [],                          frameColor: '#C8B880', reason: 'Allicin has potent anti-inflammatory properties; the prebiotic content feeds beneficial gut bacteria central to oestrogen metabolism — crush and let sit 10 minutes before cooking to maximise allicin' },
      { emoji: '🫐', name: 'Seasonal berries', latin: 'Rubus / Vaccinium spp.',  benefit: 'Antioxidants · Vitamin C', type: 'fruit',seasons: [],                         frameColor: '#5A3080', reason: 'Whatever berries are at peak locally is always the right choice — buy in season and freeze the surplus; frozen at peak ripeness retain more nutrients than off-season fresh' },
      { emoji: '🥕', name: 'Carrots',          latin: 'Daucus carota',           benefit: 'Beta-carotene · Fibre', type: 'vegetable', seasons: [],                       frameColor: '#E07020', reason: 'A daily raw carrot is used in "carrot detox" protocols to bind excess oestrogens in the gut; buy unwashed bunches with the tops still attached for maximum freshness' },
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

const TYPE_COLOR: Record<'fruit' | 'vegetable' | 'herb', { bg: string; border: string; text: string; dot: string }> = {
  fruit:     { bg: 'var(--color-accent-light)', border: 'var(--color-accent)',     text: 'var(--color-accent-dark)', dot: 'var(--color-accent)'     },
  vegetable: { bg: 'var(--color-moss-light)',   border: 'var(--color-moss-base)',  text: 'var(--color-moss-dark)',   dot: 'var(--color-moss-base)'  },
  herb:      { bg: 'var(--color-blue-light)',   border: 'var(--color-blue-base)',  text: 'var(--color-blue-dark)',   dot: 'var(--color-blue-base)'  },
};

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', seasonal: 'In season', fruit: 'Fruit', vegetable: 'Veg', herb: 'Herb',
};

// ── Produce frame ─────────────────────────────────────────────────────────────

function ProduceFrame({ item }: { item: ProduceItem }) {
  const c = TYPE_COLOR[item.type];
  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 88, height: 88,
        borderRadius: 12,
        padding: 5,
        background: '#F8F5F0',
        boxShadow: `0 2px 12px ${item.frameColor}44, 0 0 0 1px ${item.frameColor}33`,
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: 8,
          background: `linear-gradient(135deg, ${item.frameColor}22 0%, ${item.frameColor}08 100%)`,
          border: `1.5px solid ${item.frameColor}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {[['2px','2px'],['auto','2px'],['2px','auto'],['auto','auto']].map(([t,l], i) => (
            <span key={i} style={{
              position: 'absolute',
              top: t === 'auto' ? undefined : t,
              bottom: t === 'auto' ? '2px' : undefined,
              left: l === 'auto' ? undefined : l,
              right: l === 'auto' ? '2px' : undefined,
              width: 3, height: 3, borderRadius: '50%',
              background: item.frameColor, opacity: 0.3,
            }} />
          ))}
          {item.emoji}
        </div>
      </div>
      <p style={{ fontSize: 9, fontStyle: 'italic', textAlign: 'center', color: item.frameColor, opacity: 0.8, maxWidth: 88, lineHeight: 1.3 }}>
        {item.latin}
      </p>
      {/* Benefit badge */}
      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
        {item.benefit}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FarmersMarketCard({ cycles, prediction, bare = false }: Props) {
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

  const activePhase   = viewPhase ?? todayPhase;
  const isToday       = viewPhase === null || viewPhase === todayPhase;
  const currentSeason = getCurrentSeason();

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
    setSelected(null);
  };

  const style = PHASE_STYLE[activePhase];
  const { headline, items } = ALL_PRODUCE[activePhase];

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
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Farmers market</p>
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-follicular)' }}>🧺</div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="px-5 py-2.5 flex items-center gap-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        {(['all', 'seasonal', 'fruit', 'vegetable', 'herb'] as Filter[]).map(f => {
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
                    ? { background: TYPE_COLOR[f as 'fruit'|'vegetable'|'herb'].bg, color: TYPE_COLOR[f as 'fruit'|'vegetable'|'herb'].text, border: `1px solid ${TYPE_COLOR[f as 'fruit'|'vegetable'|'herb'].border}` }
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

      {/* Expanded detail */}
      {selectedItem && (() => {
        const inSeason   = isInSeason(selectedItem, currentSeason);
        const seasonNote = selectedItem.seasons.length === 0
          ? 'Available year-round'
          : `Best in: ${selectedItem.seasons.map(s => `${SEASON_EMOJI[s]} ${SEASON_LABEL[s]}`).join(' · ')}`;
        const c = TYPE_COLOR[selectedItem.type];
        return (
          <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
            <div className="flex gap-3 p-3" style={{ background: c.bg }}>
              <ProduceFrame item={selectedItem} />
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
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.06)', color: c.text }}>
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
            ? 'Log a period to see produce picks tailored to your current cycle phase.'
            : 'Tap any item for preparation tips · Availability varies by region and market.'}
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
