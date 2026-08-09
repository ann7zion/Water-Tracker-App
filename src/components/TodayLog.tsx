import type { Entry, Unit } from '../lib/types';
import { formatTime } from '../lib/date';
import { formatAmount } from '../lib/units';

interface TodayLogProps {
  entries: Entry[];
  unit: Unit;
  onRemove: (id: string) => void;
}

export default function TodayLog({ entries, unit, onRemove }: TodayLogProps) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No entries yet today. Log your first glass!</p>;
  }

  const sorted = [...entries].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <ul className="divide-y divide-slate-100">
      {sorted.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-lg">💧</span>
            <div>
              <p className="text-sm font-medium text-slate-700">{formatAmount(entry.amountMl, unit)}</p>
              <p className="text-xs text-slate-400">{formatTime(entry.time)}</p>
            </div>
          </div>
          <button
            onClick={() => onRemove(entry.id)}
            className="rounded-full px-2 py-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Remove entry"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
