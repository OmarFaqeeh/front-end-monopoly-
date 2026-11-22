// Gold hairline divider with a small diamond in the middle (decorative).
export default function GoldDivider({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 12" className={`h-3 w-48 text-accent ${className ?? ""}`} fill="none">
      <line x1="0" y1="6" x2="104" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="136" y1="6" x2="240" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path d="M120 0.5 L125.5 6 L120 11.5 L114.5 6 Z" fill="currentColor" />
    </svg>
  );
}
