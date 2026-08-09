import { useState } from 'react';
import type { Unit } from '../lib/types';
import { mlToUnit, unitToMl } from '../lib/units';

interface QuickAddProps {
  quickAddsMl: number[];
  unit: Unit;
  onAdd: (ml: number) => void;
}

export default function QuickAdd({ quickAddsMl, unit, onAdd }: QuickAddProps) {
  const [custom, setCustom] = useState('');

  function handleCustomAdd() {
    const value = parseFloat(custom);
    if (!value || value <= 0) return;
    onAdd(Math.round(unitToMl(value, unit)));
    setCustom('');
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2">
        {quickAddsMl.map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(ml)}
            className="flex flex-col items-center rounded-xl border border-sky-100 bg-white py-3 text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-95"
          >
            <span className="text-lg font-semibold">+{Math.round(mlToUnit(ml, unit))}</span>
            <span className="text-xs text-slate-400">{unit}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          placeholder={`Custom amount (${unit})`}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
        />
        <button
          onClick={handleCustomAdd}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 active:scale-95"
        >
          Add
        </button>
      </div>
    </div>
  );
}
