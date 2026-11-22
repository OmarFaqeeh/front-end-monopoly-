// FAQ: accessible accordion using native details/summary; the first item starts open.
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const ITEMS = [1, 2, 3, 4, 5, 6] as const;

export default async function Faq() {
  const t = await getTranslations("landing.faq");

  return (
    <Section id="faq" tone="sunken" pattern>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <div className="mx-auto max-w-3xl space-y-3">
        {ITEMS.map((n, i) => (
          <Reveal key={n} index={i % 3}>
            <details
              open={n === 1}
              className="group rounded-(--radius-card) border border-line bg-surface-raised shadow-card"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-(--radius-card) px-6 py-4 text-start font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                {t(`items.${n}.q`)}
                <ChevronDown
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="px-6 pb-5 leading-relaxed text-ink-muted">{t(`items.${n}.a`)}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
