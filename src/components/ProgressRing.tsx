interface ProgressRingProps {
  progress: number; // 0..1+
  label: string;
  sublabel: string;
}

export default function ProgressRing({ progress, label, sublabel }: ProgressRingProps) {
  const size = 220;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(progress, 1);
  const offset = circumference * (1 - clamped);
  const isComplete = progress >= 1;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-sky-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={isComplete ? 'text-emerald-500 transition-all duration-500 ease-out' : 'text-sky-500 transition-all duration-500 ease-out'}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-slate-800">{Math.round(progress * 100)}%</span>
        <span className="mt-1 text-sm font-medium text-slate-500">{label}</span>
        <span className="text-xs text-slate-400">{sublabel}</span>
      </div>
    </div>
  );
}
