"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { mola } from "@/lib/motion";

export function Switch({
  ativo,
  onChange,
  label,
}: {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={label}
      onClick={() => onChange(!ativo)}
      className={cn(
        "relative flex h-7.5 w-12 shrink-0 items-center rounded-full p-0.5",
        ativo ? "justify-end bg-success" : "justify-start bg-border",
      )}
    >
      <motion.span
        layout
        transition={mola}
        className="h-6.5 w-6.5 rounded-full bg-white shadow-(--shadow-md)"
      />
    </button>
  );
}
