import { useEffect, useState } from 'react';
import type { DayLog, Settings } from './lib/types';
import { loadLogs, saveLogs, loadSettings, saveSettings } from './lib/storage';
import { todayKey } from './lib/date';
import { formatAmount } from './lib/units';
import ProgressRing from './components/ProgressRing';
import QuickAdd from './components/QuickAdd';
import TodayLog from './components/TodayLog';
import History from './components/History';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [logs, setLogs] = useState<Record<string, DayLog>>(() => loadLogs());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => saveLogs(logs), [logs]);
  useEffect(() => saveSettings(settings), [settings]);

  const key = todayKey();
  const today = logs[key] ?? { date: key, entries: [] };
  const totalMl = today.entries.reduce((sum, e) => sum + e.amountMl, 0);
  const progress = settings.goalMl > 0 ? totalMl / settings.goalMl : 0;

  function addWater(amountMl: number) {
    const entry = { id: crypto.randomUUID(), amountMl, time: new Date().toISOString() };
    setLogs((prev) => {
      const day = prev[key] ?? { date: key, entries: [] };
      return { ...prev, [key]: { ...day, entries: [...day.entries, entry] } };
    });
  }

  function removeEntry(id: string) {
    setLogs((prev) => {
      const day = prev[key];
      if (!day) return prev;
      return { ...prev, [key]: { ...day, entries: day.entries.filter((e) => e.id !== id) } };
    });
  }

  const remainingMl = Math.max(settings.goalMl - totalMl, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="mx-auto max-w-md px-4 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <h1 className="text-xl font-bold text-slate-800">AquaTrack</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </header>

        <section className="mt-8 flex flex-col items-center rounded-3xl bg-white p-6 shadow-sm">
          <ProgressRing
            progress={progress}
            label={formatAmount(totalMl, settings.unit)}
            sublabel={`of ${formatAmount(settings.goalMl, settings.unit)} goal`}
          />
          <p className="mt-4 text-sm text-slate-500">
            {remainingMl > 0
              ? `${formatAmount(remainingMl, settings.unit)} left to reach your goal`
              : "You've hit your goal today! 🎉"}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick add</h2>
          <QuickAdd quickAddsMl={settings.quickAddsMl} unit={settings.unit} onAdd={addWater} />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Today's log</h2>
          <TodayLog entries={today.entries} unit={settings.unit} onRemove={removeEntry} />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Last 7 days</h2>
          <History logs={logs} goalMl={settings.goalMl} unit={settings.unit} />
        </section>
      </div>

      {showSettings && (
        <SettingsModal settings={settings} onSave={setSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
