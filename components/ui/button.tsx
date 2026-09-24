"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const variantes = {
  primary: "bg-primary text-bg",
  secondary: "bg-surface-alt text-text border border-border",
  ghost: "bg-transparent text-text",
  danger: "bg-danger text-bg",
} as const;

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variante?: keyof typeof variantes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = "primary", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "no-select inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-[15px] font-medium shadow-(--shadow-sm) disabled:opacity-50",
          variantes[variante],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
