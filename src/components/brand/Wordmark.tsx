"use client";
// Gold-foil wordmark with divider, CSS entrance and one light sweep.
import { useTranslations } from "next-intl";

function Divider() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 12"
      className="my-6 h-3 w-48 text-(--hero-gold-2) sm:w-60"
      fill="none"
    >
      <line x1="0" y1="6" x2="104" y2="6" stroke="currentColor" strokeWidth="1" />
      <line x1="136" y1="6" x2="240" y2="6" stroke="currentColor" strokeWidth="1" />
      <path d="M120 0.5 L125.5 6 L120 11.5 L114.5 6 Z" fill="currentColor" />
    </svg>
  );
}

export default function Wordmark({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("landing.wordmark");

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="enter-up text-balance">
        <span className="gold-foil gold-sweep enter-tracking font-heading text-[clamp(3rem,11vw,8rem)] leading-[0.95] font-semibold tracking-[0.14em] uppercase">
          {t("latin")}
        </span>
      </h1>
      <Divider />
      {children}
    </div>
  );
}
