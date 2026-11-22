// Section header: gold eyebrow flanked by hairlines, large heading, short intro.
import clsx from "clsx";
import Reveal from "@/components/ui/Reveal";

interface Props {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "center" | "start";
}

export default function SectionHeader({ eyebrow, title, intro, align = "center" }: Props) {
  const center = align === "center";
  return (
    <Reveal className={clsx("mb-14", center ? "text-center" : "text-start")}>
      <p className={clsx("eyebrow text-gold flex items-center gap-4", center && "justify-center")}>
        <span aria-hidden="true" className="h-px w-10 bg-accent/60" />
        {eyebrow}
        <span aria-hidden="true" className="h-px w-10 bg-accent/60" />
      </p>
      <h2 className="font-heading mt-5 text-4xl leading-tight font-semibold text-balance text-ink sm:text-5xl">
        {title}
      </h2>
      {intro && (
        <p
          className={clsx(
            "mt-4 max-w-[60ch] leading-relaxed text-ink-muted",
            center && "mx-auto",
          )}
        >
          {intro}
        </p>
      )}
    </Reveal>
  );
}
