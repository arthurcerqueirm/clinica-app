"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { toque } from "@/lib/motion";

const variantes = {
  primary: "bg-primary text-bg shadow-(--shadow-md)",
  secondary: "bg-surface-alt text-text border border-border",
  ghost: "bg-transparent text-text",
  danger: "bg-danger text-bg shadow-(--shadow-md)",
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
        transition={toque}
        className={cn(
          "no-select inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold disabled:opacity-50",
          variantes[variante],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
