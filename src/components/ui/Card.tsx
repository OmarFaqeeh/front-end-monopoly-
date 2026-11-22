// Surface card: raised background, hairline border, card shadow and radius.
import clsx from "clsx";
import type { HTMLAttributes } from "react";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-(--radius-card) border border-line bg-surface-raised shadow-card", className)}
      {...props}
    />
  );
}
