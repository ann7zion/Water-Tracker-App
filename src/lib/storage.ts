import type { DayLog, Settings } from './types';

const LOGS_KEY = 'aquatrack.logs';
const SETTINGS_KEY = 'aquatrack.settings';

export const DEFAULT_SETTINGS: Settings = {
  goalMl: 2000,
  unit: 'ml',
  quickAddsMl: [200, 350, 500, 750],
};

export function loadLogs(): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DayLog>) : {};
  } catch {
    return {};
  }
}

export function saveLogs(logs: Record<string, DayLog>): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
