"use client";
// Fade-up on scroll (once, 16px, staggered by index x 60ms). Neutralized under reduced motion via CSS.
import { motion } from "framer-motion";
import clsx from "clsx";

export default function Reveal({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={clsx("reveal", className)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.06 }}
    >
      {children}
    </motion.div>
  );
}
