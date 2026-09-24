"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

export function Chip({
  ativo,
  className,
  ...props
}: Omit<HTMLMotionProps<"button">, "ref"> & { ativo?: boolean }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "no-select inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-4 text-[13px] font-medium",
        ativo
          ? "border-primary bg-primary text-bg"
          : "border-border bg-surface text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
