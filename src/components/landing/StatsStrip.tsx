// Stats strip: four static facts (no usage numbers) with large gold Cormorant numerals.
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const ITEMS = [1, 2, 3, 4] as const;

export default async function StatsStrip() {
  const t = await getTranslations("landing.stats");

  return (
    <Section id="stats" tone="surface" pattern className="!py-20 sm:!py-24">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
      <dl className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
        {ITEMS.map((n, i) => (
          <Reveal key={n} index={i} className="px-4 text-center md:border-s md:border-line md:first:border-s-0">
            <dd className="font-heading text-gold text-5xl font-semibold text-balance sm:text-6xl">
              {t(`items.${n}.value`)}
            </dd>
            <dt className="mt-2 text-sm tracking-wide text-ink-muted">{t(`items.${n}.label`)}</dt>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}
