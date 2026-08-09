import { useState } from 'react';
import type { Settings, Unit } from '../lib/types';
import { mlToUnit, unitToMl } from '../lib/units';

interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [unit, setUnit] = useState<Unit>(settings.unit);
  const [goal, setGoal] = useState(String(Math.round(mlToUnit(settings.goalMl, settings.unit))));

  function handleSave() {
    const goalValue = parseFloat(goal);
    if (!goalValue || goalValue <= 0) return;
    onSave({ ...settings, unit, goalMl: Math.round(unitToMl(goalValue, unit)) });
    onClose();
  }

  function handleUnitChange(next: Unit) {
    if (next === unit) return;
    const currentGoalValue = parseFloat(goal);
    if (currentGoalValue > 0) {
      const goalMl = unitToMl(currentGoalValue, unit);
      setGoal(String(Math.round(mlToUnit(goalMl, next))));
    }
    setUnit(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800">Settings</h2>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-600">Units</label>
          <div className="mt-1.5 flex gap-2">
            {(['ml', 'oz'] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${
                  unit === u
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {u === 'ml' ? 'Milliliters' : 'Fluid ounces'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-slate-600">Daily goal ({unit})</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-sky-500 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
