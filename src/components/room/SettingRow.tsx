// One settings row: icon square, title + description, control at the end.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function SettingRow({
  Icon,
  title,
  description,
  badge,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-brand-strong">
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-ink">
          {title}
          {badge && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-on-accent">
              {badge}
            </span>
          )}
        </p>
        <p className="text-[13px] leading-snug text-ink-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
