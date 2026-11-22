// One button component for the whole site: gold (primary), outline (secondary), quiet (tertiary).
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "gold" | "outline" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const sizeClass: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

/** Class string for non-button elements (links, custom controls) that must look like a Button. */
export function buttonClass(variant: ButtonVariant, size: ButtonSize = "md", extra?: string) {
  return clsx("btn", `btn-${variant}`, sizeClass[size], extra);
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width (label centered, icons pinned to the edges). */
  block?: boolean;
  /** Leading icon, drawn inside a 28px circle (outline variant). */
  icon?: ReactNode;
  /** Trailing arrow inside a 28px circle (gold variant); mirrored in RTL. */
  arrow?: boolean;
}

export default function Button({
  variant = "outline",
  size = "md",
  block,
  icon,
  arrow,
  className,
  type = "button",
  children,
  ...props
}: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, clsx(block && "btn-block", className))} {...props}>
      {icon && (
        <span aria-hidden="true" className="btn-icon btn-icon-lead">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {arrow && (
        <span aria-hidden="true" className="btn-icon btn-icon-trail">
          <ArrowRight size={16} strokeWidth={1.5} />
        </span>
      )}
    </button>
  );
}
