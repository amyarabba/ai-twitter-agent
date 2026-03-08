import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  change: string;
  tone: 'cyan' | 'lime' | 'amber' | 'rose';
}

const toneClasses: Record<MetricCardProps['tone'], string> = {
  cyan: 'from-cyan-400/20 to-sky-500/10 text-cyan-200 ring-cyan-400/20',
  lime: 'from-lime-400/20 to-emerald-500/10 text-lime-200 ring-lime-400/20',
  amber: 'from-amber-400/20 to-orange-500/10 text-amber-200 ring-amber-400/20',
  rose: 'from-rose-400/20 to-fuchsia-500/10 text-rose-200 ring-rose-400/20',
};

export function MetricCard({
  icon,
  label,
  value,
  hint,
  change,
  tone,
}: MetricCardProps) {
  return (
    <div className="panel flex h-full flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
        <div
          className={`rounded-2xl bg-gradient-to-br p-3 ring-1 ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{change}</p>
        <p className="text-sm leading-6 text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
