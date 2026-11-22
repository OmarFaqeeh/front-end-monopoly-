// Localized landing page: hero, how to play, closing band, footer.
import type { Metadata } from "next";
import { preload } from "react-dom";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/components/hero/Hero";
import BoardShowcase from "@/components/landing/BoardShowcase";
import ClosingBand from "@/components/landing/ClosingBand";
import Faq from "@/components/landing/Faq";
import Features from "@/components/landing/Features";
import HowToPlay from "@/components/landing/HowToPlay";
import PlayWithFriends from "@/components/landing/PlayWithFriends";
import SiteFooter from "@/components/landing/SiteFooter";
import StatsStrip from "@/components/landing/StatsStrip";
import { routing } from "@/i18n/routing";
import { mediaExists as media, warnIfHeroVideoMissing } from "@/lib/media";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: "en_US",
      siteName: "Deal Rush",
    },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const hasVideo = media("hero.mp4") || media("hero.webm");
  warnIfHeroVideoMissing(hasVideo);
  const hasWebm = media("hero.webm");
  const hasPoster = media("hero-poster.jpg");
  if (hasPoster) preload("/media/hero-poster.jpg", { as: "image", fetchPriority: "high" });

  return (
    <main>
      <Hero hasVideo={hasVideo} hasWebm={hasWebm} hasPoster={hasPoster} />
      <StatsStrip />
      <Features />
      <BoardShowcase />
      <HowToPlay />
      <PlayWithFriends />
      <Faq />
      <ClosingBand />
      <SiteFooter />
    </main>
  );
}
