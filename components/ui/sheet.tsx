"use client";

import { Drawer } from "vaul";
import { cn } from "@/lib/cn";

export function Sheet({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  children,
  className,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Drawer.Root open={aberto} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl bg-surface px-5 pt-3 pb-[calc(var(--safe-bottom)+1.25rem)] shadow-(--shadow-lg) outline-none",
            className,
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
          <Drawer.Title className="surgir px-1 text-[17px] font-semibold text-text">
            {titulo}
          </Drawer.Title>
          {descricao ? (
            <Drawer.Description className="surgir mt-1 px-1 text-[14px] text-text-muted">
              {descricao}
            </Drawer.Description>
          ) : (
            <Drawer.Description className="sr-only">{titulo}</Drawer.Description>
          )}
          <div className="mt-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function ItemSheet({
  icone: Icone,
  label,
  destrutivo,
  indice = 0,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  icone: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  destrutivo?: boolean;
  indice?: number;
}) {
  return (
    <button
      type="button"
      style={{ "--i": indice } as React.CSSProperties}
      className={cn(
        "surgir pressable flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] active:bg-surface-alt",
        destrutivo ? "text-danger" : "text-text",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          destrutivo ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary",
        )}
      >
        <Icone size={18} />
      </span>
      {label}
    </button>
  );
}
