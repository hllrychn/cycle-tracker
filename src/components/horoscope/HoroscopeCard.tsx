import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseISO, startOfToday } from '../../lib/dateUtils';
import { HOROSCOPE_DATA } from '../../data/horoscopeData';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number): Phase {
  if (cycleDay <= avgPeriodDuration)    return 'menstrual';
  if (cycleDay <= avgCycleLength - 16)  return 'follicular';
  if (cycleDay <= avgCycleLength - 11)  return 'ovulatory';
  if (cycleDay <= avgCycleLength)       return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const todayISO = new Date().toISOString().slice(0, 10);
  const pastCycles = cycles.filter(c => c.start_date <= todayISO);
  if (pastCycles.length > 0) {
    const latest = [...pastCycles].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(startOfToday(), parseISO(latest.start_date)) + 1;
    return day >= 1 ? day : null;
  }
  if (prediction) {
    const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (daysUntil >= 0) return Math.max(1, prediction.avgCycleLength - daysUntil);
  }
  return null;
}

function getDataIndex(cycleDay: number, cycleLength: number): number {
  const lastHalfStartDay = cycleLength - 13;
  if (cycleDay <= 14) return cycleDay - 1;
  if (cycleDay >= lastHalfStartDay) return 35 + (cycleDay - lastHalfStartDay);
  return cycleDay - 1;
}

const UNKNOWN_BLURBS: Record<string, string> = {
  mood:    "Log your period start date to unlock your daily hormone horoscope.",
  brain:   "Your cycle data will unlock brain and cognition insights once you've logged a period.",
  energy:  "Your cycle data will unlock energy insights here once you've logged a period.",
  money:   "Add a period log to see money insights tailored to your cycle phase.",
  sex:     "Log a period to see insights about your sexual energy and desire throughout the cycle.",
  career:  "Log a period to see career and project insights based on where you are in your cycle.",
  food:    "Food and craving insights are unlocked once you've logged your first period.",
  sleep:   "Your sleep insights will appear here once you've logged a period start date.",
};

const UNKNOWN_ROMANCE = {
  single:       "Once you've logged a period, this section will reflect your current cycle phase.",
  relationship: "Once you've logged a period, this section will reflect your current cycle phase.",
};

type SingleSlide  = { type: 'single';  color: string; key: string;  label: string; emoji: string };
type RomanceSlide = { type: 'romance'; color: string; label: string; emoji: string };
type Slide = SingleSlide | RomanceSlide;

const SLIDES: Slide[] = [
  { type: 'single',  color: 'var(--color-phase-menstrual)',  key: 'mood',   label: 'Mood',    emoji: '🌙' },
  { type: 'single',  color: 'var(--color-phase-menstrual)',  key: 'brain',  label: 'Brain',   emoji: '🧠' },
  { type: 'single',  color: 'var(--color-blue-light)',       key: 'energy', label: 'Energy',  emoji: '⚡' },
  { type: 'single',  color: 'var(--color-blue-light)',       key: 'money',  label: 'Money',   emoji: '💸' },
  { type: 'romance', color: 'var(--color-accent-light)',     label: 'Romance', emoji: '🌹'    },
  { type: 'single',  color: 'var(--color-phase-ovulation)',  key: 'sex',    label: 'Sex',     emoji: '🔥' },
  { type: 'single',  color: 'var(--color-phase-ovulation)',  key: 'career', label: 'Career',  emoji: '✨' },
  { type: 'single',  color: 'var(--color-phase-luteal)',     key: 'food',   label: 'Food',    emoji: '🍓' },
  { type: 'single',  color: 'var(--color-phase-luteal)',     key: 'sleep',  label: 'Sleep',   emoji: '🌊' },
];

const PHASE_META: Record<Phase, { label: string; color: string; text: string }> = {
  menstrual:  { label: 'Menstrual',  color: 'var(--color-phase-menstrual)',  text: 'var(--color-text-primary)' },
  follicular: { label: 'Follicular', color: 'var(--color-phase-follicular)', text: 'var(--color-text-primary)' },
  ovulatory:  { label: 'Ovulatory',  color: 'var(--color-phase-ovulation)',  text: 'var(--color-moss-dark)'   },
  luteal:     { label: 'Luteal',     color: 'var(--color-phase-luteal)',     text: 'var(--color-text-primary)' },
  unknown:    { label: 'Unknown',    color: 'var(--color-peat-light)',       text: 'var(--color-peat-deep)'   },
};

const proseColor = 'var(--color-peat-deep)';
const labelColor = 'var(--color-text-primary)';
const divider    = '1px solid var(--color-peat-light)';

export function HoroscopeCard({ cycles, prediction }: Props) {
  const todayDay = getCurrentCycleDay(cycles, prediction);
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const [viewDay, setViewDay]             = useState<number | null>(null);
  const [slideIndex, setSlideIndex]       = useState(0);
  const [romanceView, setRomanceView]     = useState<'single' | 'relationship'>('single');
  const [romanceDropdownOpen, setRomanceDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const romanceRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openRomanceDropdown = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (romanceRef.current) {
      const rect = romanceRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setRomanceDropdownOpen(true);
  };

  const scheduleCloseRomanceDropdown = () => {
    closeTimerRef.current = setTimeout(() => setRomanceDropdownOpen(false), 150);
  };

  const activeDay = viewDay ?? todayDay;
  const isToday   = viewDay === null || viewDay === todayDay;
  const phase     = activeDay != null ? getPhase(activeDay, avgCycleLength, avgPeriodDuration) : 'unknown';
  const phaseMeta = PHASE_META[phase];
  const dataIndex = activeDay != null ? getDataIndex(activeDay, avgCycleLength) : null;

  function getText(key: string): string {
    if (dataIndex == null) return UNKNOWN_BLURBS[key] ?? '';
    const day = HOROSCOPE_DATA[dataIndex];
    return day[key as keyof typeof day] ?? '';
  }

  function getRomanceTexts(): { single: string; relationship: string } {
    if (dataIndex == null) return UNKNOWN_ROMANCE;
    const raw = HOROSCOPE_DATA[dataIndex]['romance'] ?? '';
    const clean = raw.replace(/^["'"]+|["'"]+$/g, '').trim();
    const singleMarker = /If you're single\s*/i;
    const relMarker    = /If you're in a relationship\s*/i;
    const singleIdx    = clean.search(singleMarker);
    const relIdx       = clean.search(relMarker);
    if (singleIdx !== -1 && relIdx !== -1) {
      return {
        single:       clean.slice(clean.match(singleMarker)![0].length + singleIdx, relIdx).trim(),
        relationship: clean.slice(clean.match(relMarker)![0].length + relIdx).trim(),
      };
    }
    return { single: clean, relationship: '' };
  }

  // Day navigation
  const canNavigate = todayDay != null;
  const goToDay = (day: number) => {
    const wrapped = day > avgCycleLength ? 1 : day < 1 ? avgCycleLength : day;
    setViewDay(wrapped === todayDay ? null : wrapped);
  };

  const navColor = (disabled: boolean) => ({
    color:  disabled ? 'var(--color-peat-dark)' : labelColor,
    cursor: disabled ? 'default' : 'pointer',
  });

  const romance = getRomanceTexts();

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold shrink-0" style={{ color: labelColor }}>Hormone Horoscope</p>
        <div className="flex items-center gap-2 ml-auto">
          {canNavigate && !isToday && (
            <button
              onClick={() => setViewDay(null)}
              className="text-xs px-2 py-0.5 rounded-full transition-colors"
              style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}
            >
              ↩ Today
            </button>
          )}
          {activeDay != null && <span className="text-xs" style={{ color: labelColor }}>Day {activeDay}</span>}
          {activeDay != null && (
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: phaseMeta.color, color: phaseMeta.text }}>
              {phaseMeta.label}
            </span>
          )}
          {canNavigate && (
            <div className="flex items-center gap-1">
              <button onClick={() => goToDay((activeDay ?? 1) - 1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={navColor(false)}>‹</button>
              <button onClick={() => goToDay((activeDay ?? 1) + 1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={navColor(false)}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* Tab strip — scrollable on mobile */}
      <div
        className="flex overflow-x-auto scrollbar-none"
        style={{ borderTop: divider, borderBottom: divider }}
      >
        {SLIDES.map((slide, i) => {
          const isActive = i === slideIndex;

          if (slide.type === 'romance') {
            return (
              <div
                key={i}
                ref={romanceRef}
                className="relative flex-none sm:flex-1"
                style={{ borderRight: i < SLIDES.length - 1 ? divider : undefined }}
                onMouseEnter={openRomanceDropdown}
                onMouseLeave={scheduleCloseRomanceDropdown}
              >
                <button
                  onClick={() => setSlideIndex(i)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-5 text-xs font-medium transition-colors whitespace-nowrap"
                  style={{
                    color:        isActive ? labelColor : 'var(--color-peat-deep)',
                    background:   isActive ? slide.color : 'transparent',
                    borderBottom: isActive ? '2px solid var(--color-moss-base)' : '2px solid transparent',
                  }}
                >
                  <span>{slide.emoji}</span>
                  <span>Romance</span>
                  <span style={{ fontSize: '9px', opacity: 0.5 }}>▾</span>
                </button>

                {romanceDropdownOpen && createPortal(
                  <div
                    onMouseEnter={openRomanceDropdown}
                    onMouseLeave={scheduleCloseRomanceDropdown}
                    style={{
                      position: 'fixed',
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      zIndex: 200,
                      background: '#FFFFFF',
                      border: '1px solid var(--color-peat-light)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      minWidth: '150px',
                      boxShadow: '0 4px 16px rgba(46,40,32,0.14)',
                    }}
                  >
                    {([['single', '🌹', 'Single'], ['relationship', '💑', 'In a relationship']] as const).map(([v, emoji, label]) => (
                      <button
                        key={v}
                        onClick={() => { setRomanceView(v); setRomanceDropdownOpen(false); setSlideIndex(i); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors"
                        style={{
                          background: romanceView === v ? 'var(--color-accent-light)' : 'transparent',
                          color: 'var(--color-text-primary)',
                          fontWeight: romanceView === v ? 600 : 400,
                        }}
                        onMouseEnter={e => { if (romanceView !== v) e.currentTarget.style.background = 'var(--color-peat-light)'; }}
                        onMouseLeave={e => { if (romanceView !== v) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            );
          }

          return (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className="flex-none sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                color:        isActive ? labelColor : 'var(--color-peat-deep)',
                background:   isActive ? slide.color : 'transparent',
                borderBottom: isActive ? '2px solid var(--color-moss-base)' : '2px solid transparent',
                borderRight:  i < SLIDES.length - 1 ? divider : undefined,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = labelColor; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--color-peat-deep)'; }}
            >
              <span>{slide.emoji}</span>
              <span>{slide.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content panel — full width, slides via translateX */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${slideIndex * 100}%)` }}
        >
          {SLIDES.map((slide, i) => {
            const bg = slide.color;
            const panelStyle: React.CSSProperties = {
              width: '100%',
              flexShrink: 0,
              background: bg,
              transition: 'filter 0.15s ease',
            };

            if (slide.type === 'romance') {
              const text = romanceView === 'single' ? romance.single : romance.relationship;
              return (
                <div
                  key={i}
                  className="px-8 py-8 cursor-default"
                  style={panelStyle}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  <p className="text-xs mb-4" style={{ color: labelColor }}>
                    {romanceView === 'single' ? '🌹 Single' : '💑 Relationship'}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: proseColor }}>{text}</p>
                </div>
              );
            }

            return (
              <div
                key={i}
                className="px-8 py-8 cursor-default"
                style={panelStyle}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
              >
                <p className="text-xs mb-4" style={{ color: labelColor }}>{slide.emoji} {slide.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: proseColor }}>{getText(slide.key)}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
