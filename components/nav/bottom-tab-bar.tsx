"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, Plus, Wallet, Settings, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { mola, toque } from "@/lib/motion";
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
  const indiceAtivo = abas.findIndex((aba) => pathname.startsWith(aba.href));

  function item(aba: (typeof abas)[number], indice: number) {
    return (
      <TabItem
        key={aba.href}
        {...aba}
        ativo={indice === indiceAtivo}
        direcao={indiceAtivo === -1 ? undefined : indice > indiceAtivo ? "avancar" : "voltar"}
      />
    );
  }

  return (
    <>
      <nav
        style={{ viewTransitionName: "barra-abas" }}
        className="fixed inset-x-3 bottom-[calc(var(--safe-bottom)+0.75rem)] z-40 mx-auto max-w-md rounded-full border border-border/70 bg-surface/85 shadow-(--shadow-lg) backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-1.5 py-1.5">
          {abas.slice(0, 2).map((aba, i) => item(aba, i))}
          <div className="w-16 shrink-0" aria-hidden />
          {abas.slice(2).map((aba, i) => item(aba, i + 2))}
        </div>

        <motion.button
          type="button"
          onClick={() => setSheetAberto(true)}
          whileTap={{ scale: 0.9 }}
          transition={toque}
          aria-label="Ação rápida"
          className="absolute -top-5 left-1/2 flex h-15 w-15 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-bg shadow-(--shadow-lg) ring-4 ring-bg"
        >
          <motion.span animate={{ rotate: sheetAberto ? 45 : 0 }} transition={mola}>
            <Plus size={26} strokeWidth={2.5} />
          </motion.span>
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
  direcao,
}: {
  href: string;
  label: string;
  icone: LucideIcon;
  ativo: boolean;
  direcao?: "avancar" | "voltar";
}) {
  return (
    <Link
      href={href}
      transitionTypes={direcao && !ativo ? [direcao] : undefined}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "no-select relative flex h-13 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium",
        ativo ? "text-primary" : "text-text-muted",
      )}
    >
      {ativo && (
        <motion.span
          layoutId="aba-ativa"
          transition={mola}
          className="absolute inset-0 rounded-full bg-primary-soft"
        />
      )}
      <motion.span
        className="relative"
        animate={{ scale: ativo ? 1.08 : 1, y: ativo ? -1 : 0 }}
        transition={mola}
      >
        <Icone size={21} strokeWidth={ativo ? 2.4 : 2} />
      </motion.span>
      <span className="relative">{label}</span>
    </Link>
  );
}
