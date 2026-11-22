// Section shell: alternating surface tone, optional faint pattern, gold divider on the top edge.
import clsx from "clsx";
import GeometricPattern from "./GeometricPattern";
import GoldDivider from "./GoldDivider";

interface Props {
  id: string;
  tone: "surface" | "sunken";
  pattern?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ id, tone, pattern, children, className }: Props) {
  return (
    <section
      id={id}
      className={clsx(
        "relative scroll-mt-4 px-4 py-24 sm:px-8 sm:py-32",
        tone === "sunken" ? "bg-surface-sunken" : "bg-surface",
        className,
      )}
    >
      {pattern && <GeometricPattern id={id} />}
      <div className="absolute inset-x-0 top-0 z-10 flex -translate-y-1/2 justify-center">
        <GoldDivider />
      </div>
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
