import type { ReactNode } from 'react';

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={joinClasses('panel p-5 md:p-6', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? <p className="subtle-label">{eyebrow}</p> : null}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
