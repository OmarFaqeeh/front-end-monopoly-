// Play with friends: three steps joined by a dashed gold line, plus a decorative example room code.
import { KeyRound, Link as LinkIcon, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/ui/Reveal";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const STEPS = [
  { n: 1, Icon: KeyRound },
  { n: 2, Icon: LinkIcon },
  { n: 3, Icon: Users },
] as const;

export default async function PlayWithFriends() {
  const t = await getTranslations("landing");

  return (
    <Section id="friends" tone="surface">
      <SectionHeader eyebrow={t("friends.eyebrow")} title={t("friends.title")} intro={t("friends.intro")} />
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_300px]">
        <ol className="relative grid gap-10 sm:grid-cols-3">
          <span
            aria-hidden="true"
            className="absolute inset-x-[16.66%] top-7 hidden border-t border-dashed border-accent sm:block"
          />
          {STEPS.map(({ n, Icon }, i) => (
            <li key={n}>
              <Reveal index={i} className="relative flex flex-col items-center text-center">
                <span className="relative flex size-14 items-center justify-center rounded-full border border-accent bg-surface-raised text-brand-strong shadow-card">
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <p className="mt-4 max-w-[18ch] font-semibold text-balance text-ink">{t(`friends.steps.${n}`)}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal index={3}>
          <div
            aria-hidden="true"
            className="mx-auto w-full max-w-xs rounded-(--radius-card) border border-line bg-surface-raised p-6 text-center shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">{t("friends.codeLabel")}</span>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                {t("friends.example")}
              </span>
            </div>
            <p dir="ltr" className="mt-5 font-mono text-3xl font-semibold tracking-[0.3em] text-ink">
              K7M2QX
            </p>
            <div className="mx-auto mt-5 h-px w-16 bg-accent" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
