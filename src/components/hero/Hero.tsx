// Hero: background, header controls, wordmark, tagline, panel, microcopy, scroll cue.
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ClosedBanner from "./ClosedBanner";
import HeroTagline from "./HeroTagline";
import HeroVideo from "./HeroVideo";
import NicknameForm from "./NicknameForm";

interface Props {
  hasVideo: boolean;
  hasWebm: boolean;
  hasPoster: boolean;
}

export default async function Hero(props: Props) {
  const t = await getTranslations("landing");

  return (
    <section className="hero-scope relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-24 text-(--hero-text)">
      <HeroVideo {...props} />
      <ClosedBanner />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-end px-4 py-4 sm:px-8">
        <ThemeToggle className="border-(--hero-text)/30" />
      </header>

      <div className="relative z-10 flex w-full flex-col items-center">
        <Wordmark>
          <HeroTagline>{t("tagline")}</HeroTagline>
        </Wordmark>
        <NicknameForm />
      </div>

      <a
        href="#stats"
        aria-label={t("scrollCue")}
        className="absolute bottom-6 z-10 inline-flex size-10 items-center justify-center rounded-full text-(--hero-text)"
      >
        <ChevronDown size={26} strokeWidth={1.5} className="scroll-cue" aria-hidden="true" />
      </a>
    </section>
  );
}
