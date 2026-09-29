"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";
import { mola, toque } from "@/lib/motion";

// `grupo`: chips mutuamente exclusivos compartilham o fundo ativo, que desliza
// de um para o outro.
export function Chip({
  ativo,
  grupo,
  className,
  children,
  ...props
}: Omit<HTMLMotionProps<"button">, "ref"> & { ativo?: boolean; grupo?: string }) {
  const pillDeslizante = Boolean(grupo);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={toque}
      className={cn(
        "no-select relative inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-4 text-[13px] font-medium",
        ativo
          ? cn("border-primary text-bg", !pillDeslizante && "bg-primary")
          : "border-border bg-surface text-text-muted",
        className,
      )}
      {...props}
    >
      {ativo && pillDeslizante && (
        <motion.span
          layoutId={`chip-${grupo}`}
          transition={mola}
          className="absolute -inset-px rounded-full bg-primary"
        />
      )}
      <span className="relative">{children as React.ReactNode}</span>
    </motion.button>
  );
}
