// Features: six cards in a responsive grid, each with an outline lucide icon.
import { Bot, Handshake, MonitorSmartphone, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const ITEMS = [
  { n: 1, Icon: Zap },
  { n: 2, Icon: SlidersHorizontal },
  { n: 3, Icon: Bot },
  { n: 4, Icon: ShieldCheck },
  { n: 5, Icon: MonitorSmartphone },
  { n: 6, Icon: Handshake },
] as const;

export default async function Features() {
  const t = await getTranslations("landing.features");

  return (
    <Section id="features" tone="sunken" pattern>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ n, Icon }, i) => (
          <li key={n}>
            <Reveal index={i % 3} className="h-full">
              <article className="h-full rounded-(--radius-card) border border-line bg-surface-raised p-7 shadow-card">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{t(`items.${n}.title`)}</h3>
                <p className="mt-2 leading-relaxed text-ink-muted">{t(`items.${n}.body`)}</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
