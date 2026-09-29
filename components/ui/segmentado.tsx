"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { mola } from "@/lib/motion";

export function Segmentado<T extends string>({
  id,
  opcoes,
  valor,
  onChange,
  className,
}: {
  id: string;
  opcoes: readonly { valor: T; label: React.ReactNode }[];
  valor: T | null;
  onChange: (valor: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("no-select flex rounded-full bg-surface-alt p-1", className)}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "relative flex h-9 flex-1 items-center justify-center rounded-full px-3 text-[13px] font-medium",
              ativo ? "text-text" : "text-text-muted",
            )}
          >
            {ativo && (
              <motion.span
                layoutId={`segmentado-${id}`}
                transition={mola}
                className="absolute inset-0 rounded-full bg-surface shadow-(--shadow-md)"
              />
            )}
            <span className="relative">{opcao.label}</span>
          </button>
        );
      })}
    </div>
  );
}
