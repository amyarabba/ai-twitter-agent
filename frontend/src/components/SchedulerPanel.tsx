import type { ScheduleSlot } from '../types';

interface SchedulerPanelProps {
  schedule: ScheduleSlot[];
}

const statusClasses: Record<ScheduleSlot['status'], string> = {
  optimal: 'bg-lime-400/12 text-lime-200 ring-lime-400/25',
  watch: 'bg-cyan-400/12 text-cyan-200 ring-cyan-400/25',
  experimental: 'bg-amber-400/12 text-amber-200 ring-amber-400/25',
};

export function SchedulerPanel({ schedule }: SchedulerPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schedule.map((slot) => (
        <article
          key={slot.label}
          className="rounded-[1.6rem] border border-white/8 bg-slate-950/45 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-300">{slot.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {slot.time}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ${statusClasses[slot.status]}`}
            >
              {slot.status}
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">{slot.theme}</p>
        </article>
      ))}
    </div>
  );
}
