// How-to-play section: five numbered steps beside an original property card visual.
import { getFormatter, getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import PropertyCardPreview from "./PropertyCardPreview";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const STEPS = [1, 2, 3, 4, 5] as const;

export default async function HowToPlay() {
  const t = await getTranslations("landing");
  const f = await getFormatter();

  return (
    <Section id="how" tone="sunken">
      <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
        <div>
          <SectionHeader align="start" eyebrow={t("howEyebrow")} title={t("howTitle")} intro={t("howIntro")} />
          <ol className="space-y-9">
            {STEPS.map((n, i) => (
              <li key={n}>
                <Reveal index={i} className="flex gap-5">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent font-heading text-lg font-semibold tabular-nums text-ink"
                  >
                    {f.number(n)}
                  </span>
                  <div className="max-w-[65ch]">
                    <h3 className="text-lg font-semibold text-ink">{t(`steps.${n}.title`)}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-muted">{t(`steps.${n}.body`)}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
        <Reveal index={1} className="lg:sticky lg:top-24">
          <PropertyCardPreview />
        </Reveal>
      </div>
    </Section>
  );
}
