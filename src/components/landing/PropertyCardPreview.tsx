// Original property card sample (group band + rent table) over a strip of three board tiles.
import { HelpCircle } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

const RENTS = [
  ["baseRent", 14],
  ["house1", 70],
  ["house2", 200],
  ["house3", 550],
  ["house4", 750],
  ["hotel", 950],
] as const;

export default async function PropertyCardPreview() {
  const t = await getTranslations("landing.card");
  const f = await getFormatter();

  return (
    <div role="img" aria-label={t("label")} className="mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-(--radius-card) border border-line bg-surface-raised shadow-card">
        <div className="h-16 bg-group-4" />
        <div className="px-6 pb-6 pt-5">
          <p className="font-heading text-center text-2xl font-semibold text-ink">
            {t("propertyName")}
          </p>
          <div className="mx-auto my-4 h-px w-16 bg-accent" />
          <dl className="space-y-2.5 text-sm">
            {RENTS.map(([key, amount]) => (
              <div key={key} className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">{t(key)}</dt>
                <dd className="font-semibold tabular-nums text-ink">{f.number(amount)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {(["a", "b", "c"] as const).map((k, i) => (
          <div
            key={k}
            className="flex aspect-[3/4] flex-col overflow-hidden rounded-xl border border-line bg-surface-raised shadow-card"
          >
            {i === 1 ? (
              <div className="flex flex-1 items-center justify-center text-brand">
                <HelpCircle size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
            ) : (
              <div className={i === 0 ? "h-1/4 bg-group-4" : "h-1/4 bg-group-5"} />
            )}
            <p className="px-2 pb-3 pt-2 text-center text-xs leading-snug text-ink-muted">
              {t(`tiles.${k}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
