import { useState, useCallback } from 'react';

export type AgeGroup = 'teen' | 'adult' | 'peri' | 'mature';

interface Settings {
  customCycleLength: number | null;
  customPeriodDuration: number | null;
  nextPeriodDelayDays: number;
  recurringCyclesCount: number;
  ageGroup: AgeGroup;
  showMoonPhase: boolean;
  showBiodynamic: boolean;
}

const STORAGE_KEY = 'cycleTrackerSettings';

const DEFAULTS: Settings = {
  customCycleLength: null,
  customPeriodDuration: null,
  nextPeriodDelayDays: 0,
  recurringCyclesCount: 3,
  ageGroup: 'adult',
  showMoonPhase: true,
  showBiodynamic: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function save(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  return {
    customCycleLength:       settings.customCycleLength,
    customPeriodDuration:    settings.customPeriodDuration,
    nextPeriodDelayDays:     settings.nextPeriodDelayDays,
    recurringCyclesCount:    settings.recurringCyclesCount,
    ageGroup:                settings.ageGroup,
    showMoonPhase:           settings.showMoonPhase,
    showBiodynamic:          settings.showBiodynamic,
    setCustomCycleLength:    (length: number | null) => update({ customCycleLength: length }),
    setCustomPeriodDuration: (duration: number | null) => update({ customPeriodDuration: duration }),
    addDelayDay:             () => update({ nextPeriodDelayDays: settings.nextPeriodDelayDays + 1 }),
    resetDelay:              () => update({ nextPeriodDelayDays: 0 }),
    setRecurringCyclesCount: (n: number) => update({ recurringCyclesCount: n }),
    setAgeGroup:             (g: AgeGroup) => update({ ageGroup: g }),
    setShowMoonPhase:        (v: boolean) => update({ showMoonPhase: v }),
    setShowBiodynamic:       (v: boolean) => update({ showBiodynamic: v }),
  };
}
