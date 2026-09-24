"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, Plus, Wallet, Settings, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { QuickActionsSheet } from "./quick-actions-sheet";

const abas: { href: string; label: string; icone: LucideIcon }[] = [
  { href: "/agenda", label: "Agenda", icone: Calendar },
  { href: "/clientes", label: "Clientes", icone: Users },
  { href: "/financeiro", label: "Financeiro", icone: Wallet },
  { href: "/ajustes", label: "Mais", icone: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [sheetAberto, setSheetAberto] = useState(false);

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-2">
          {abas.slice(0, 2).map((aba) => (
            <TabItem key={aba.href} {...aba} ativo={pathname.startsWith(aba.href)} />
          ))}

          <div className="w-16 shrink-0" aria-hidden />

          {abas.slice(2).map((aba) => (
            <TabItem key={aba.href} {...aba} ativo={pathname.startsWith(aba.href)} />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => setSheetAberto(true)}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Ação rápida"
          className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-bg shadow-(--shadow-lg)"
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.button>
      </nav>

      <QuickActionsSheet open={sheetAberto} onOpenChange={setSheetAberto} />
    </>
  );
}

function TabItem({
  href,
  label,
  icone: Icone,
  ativo,
}: {
  href: string;
  label: string;
  icone: LucideIcon;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "no-select flex min-w-11 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px]",
        ativo ? "text-primary" : "text-text-muted",
      )}
    >
      <Icone size={22} strokeWidth={ativo ? 2.4 : 2} />
      {label}
    </Link>
  );
}
