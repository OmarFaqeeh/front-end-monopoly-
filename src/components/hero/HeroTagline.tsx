// Tagline line with a delayed CSS fade-in that follows the wordmark.
export default function HeroTagline({ children }: { children: React.ReactNode }) {
  return (
    <p className="enter-up mt-4 text-balance text-[1.25rem] leading-snug tracking-[0.04em] text-(--hero-text)/90 [animation-delay:700ms]">
      {children}
    </p>
  );
}
