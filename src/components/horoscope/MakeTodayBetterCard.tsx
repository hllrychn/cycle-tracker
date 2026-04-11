import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number): Phase {
  if (cycleDay <= avgPeriodDuration)   return 'menstrual';
  if (cycleDay <= avgCycleLength - 16) return 'follicular';
  if (cycleDay <= avgCycleLength - 11) return 'ovulatory';
  if (cycleDay <= avgCycleLength)      return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[]): number | null {
  if (cycles.length === 0) return null;
  const todayISO = todayLocalISO();
  const pastCycles = cycles.filter(c => c.start_date <= todayISO);
  if (pastCycles.length === 0) return null;
  const latest = [...pastCycles].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const day = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
  return day >= 1 ? day : null;
}

const BLURBS: Record<Phase, string[]> = {
  menstrual: [
    "Cancel one non-essential obligation today and use that time for something that genuinely restores you. Rest is not wasted time — it's the work.",
    "Make one warm thing — tea, soup, a bath — and sit with it without rushing to the next task. Your nervous system will thank you.",
    "Tell someone close to you that you're having a hard day. You don't have to explain or justify it. Just name it.",
    "Put your phone somewhere inconvenient and give yourself one hour without the scroll. You'll feel better than you expect.",
    "Go to bed 30 minutes earlier than usual tonight. That's it. That's the whole plan.",
  ],
  follicular: [
    "Write down one thing you've been putting off starting. Then spend 20 minutes on it — just to break the seal. Momentum is easier to find now than at any other point this month.",
    "Reach out to someone you've been meaning to connect with. Your social energy is available and your message will land well.",
    "Try one new thing today — a route, a recipe, a podcast, a workout. Your brain is primed to enjoy novelty and retain it.",
    "Block 90 minutes for your most important project and protect it like an appointment you can't reschedule. Your focus will reward you.",
    "Say yes to the invitation you've been hesitating on. This week's version of you will show up better than you think.",
  ],
  ovulatory: [
    "Have the conversation you've been postponing. Your communication and empathy are at their peak — use them on something that actually matters.",
    "Do something that requires you to be seen: speak up in a meeting, post something, introduce yourself to someone new. Your presence lands well right now.",
    "Make a plan with someone you've been meaning to spend time with. Your warmth is magnetic and the connection you build now will last.",
    "Pitch the idea, send the email, make the ask. Whatever you've been waiting for the 'right moment' to do — this is it.",
    "Do something physical that genuinely challenges you. Your body is at its monthly peak and it wants to know it.",
  ],
  luteal: [
    "Identify the one task that will make tomorrow easier and do only that. Protect the rest of your energy.",
    "Say no to something non-essential today. The energy you protect is energy you get to spend on what actually matters.",
    "Improve your immediate environment in one small way — tidy one surface, open a window, put on music you like. Small changes compound when you're running low.",
    "Eat something warm and genuinely nourishing for your next meal. Your body will register the care more than usual right now.",
    "Write down three things that are actually going well. Your brain is primed to catalogue what's wrong this week — balance it out deliberately.",
  ],
  unknown: [
    "Log a period to get a personalised daily tip for making today better.",
  ],
};

const PHASE_STYLE: Record<Phase, { fill: string; text: string; border: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  text: 'var(--color-text-primary)', border: 'var(--color-peat-deep)'  },
  follicular: { fill: 'var(--color-phase-follicular)', text: 'var(--color-blue-dark)',    border: 'var(--color-blue-mid)'   },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  text: 'var(--color-moss-dark)',    border: 'var(--color-moss-base)'  },
  luteal:     { fill: 'var(--color-phase-luteal)',     text: 'var(--color-peat-deep)',    border: 'var(--color-peat-deep)'  },
  unknown:    { fill: 'var(--color-peat-light)',       text: 'var(--color-peat-deep)',    border: 'var(--color-peat-mid)'   },
};

export function MakeTodayBetterCard({ cycles, prediction }: Props) {
  const cycleDay = getCurrentCycleDay(cycles);
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const phase = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';

  const blurbs = BLURBS[phase];
  const style  = PHASE_STYLE[phase];

  const text = cycleDay != null
    ? blurbs[(cycleDay - 1) % blurbs.length]
    : blurbs[0];

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{ background: style.fill, boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: style.text }}>
          Make today better
        </p>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.4)' }}>🌱</div>
      </div>
      <p className="leading-snug" style={{ fontSize: '0.8rem', fontWeight: 300, color: style.text }}>
        {text}
      </p>
    </div>
  );
}
