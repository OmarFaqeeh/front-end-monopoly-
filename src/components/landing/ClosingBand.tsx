"use client";
// Closing band: short line and a Play button that scrolls to top and focuses the nickname input.
import { useTranslations } from "next-intl";
import { NICKNAME_INPUT_ID } from "@/components/hero/NicknameForm";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import GoldDivider from "./GoldDivider";

export default function ClosingBand() {
  const t = useTranslations("landing");

  function goTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => {
      document.getElementById(NICKNAME_INPUT_ID)?.focus({ preventScroll: true });
    }, 500);
  }

  return (
    <section className="relative bg-surface px-4 py-24 text-center sm:py-28">
      <div className="absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
        <GoldDivider />
      </div>
      <Reveal>
        <p className="font-heading text-3xl font-semibold text-balance text-ink sm:text-5xl">{t("closingLine")}</p>
        <div className="mt-8">
          <Button variant="gold" size="lg" arrow onClick={goTop}>
            {t("play")}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
