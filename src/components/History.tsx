import type { DayLog, Unit } from '../lib/types';
import { formatDayLabel, keyDaysAgo } from '../lib/date';
import { formatAmount } from '../lib/units';

interface HistoryProps {
  logs: Record<string, DayLog>;
  goalMl: number;
  unit: Unit;
}

export default function History({ logs, goalMl, unit }: HistoryProps) {
  const days = Array.from({ length: 7 }, (_, i) => keyDaysAgo(6 - i));
  const totals = days.map((key) => {
    const total = (logs[key]?.entries ?? []).reduce((sum, e) => sum + e.amountMl, 0);
    return { key, total };
  });
  const max = Math.max(goalMl, ...totals.map((d) => d.total));

  return (
    <div>
      <div className="flex h-40 items-end justify-between gap-2">
        {totals.map(({ key, total }) => {
          const heightPct = max > 0 ? Math.max((total / max) * 100, total > 0 ? 4 : 0) : 0;
          const met = total >= goalMl;
          return (
            <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-32 w-full items-end">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${met ? 'bg-emerald-400' : 'bg-sky-300'}`}
                  style={{ height: `${heightPct}%` }}
                  title={formatAmount(total, unit)}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-400">{formatDayLabel(key).slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-400">
        <span className="inline-block h-2 w-2 rounded-full bg-sky-300" /> Below goal
        <span className="ml-3 inline-block h-2 w-2 rounded-full bg-emerald-400" /> Goal met
      </div>
    </div>
  );
}
