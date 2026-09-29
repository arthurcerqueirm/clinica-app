"use client";

import Link from "next/link";
import { CalendarPlus, UserPlus, Receipt, HandCoins, type LucideIcon } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";

const acoes: { href: string; label: string; icone: LucideIcon }[] = [
  { href: "/agenda/novo", label: "Novo agendamento", icone: CalendarPlus },
  { href: "/clientes/novo", label: "Nova cliente", icone: UserPlus },
  { href: "/financeiro/despesas/nova", label: "Nova despesa", icone: Receipt },
  { href: "/financeiro/inadimplentes", label: "Receber", icone: HandCoins },
];

export function QuickActionsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet aberto={open} onOpenChange={onOpenChange} titulo="Ação rápida">
      <nav className="grid grid-cols-2 gap-2.5">
        {acoes.map((acao, indice) => (
          <Link
            key={acao.href}
            href={acao.href}
            transitionTypes={["avancar"]}
            onClick={() => onOpenChange(false)}
            style={{ "--i": indice + 1 } as React.CSSProperties}
            className="surgir pressable flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface-alt/60 p-4 text-[15px] font-medium text-text active:bg-surface-alt"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <acao.icone size={20} />
            </span>
            {acao.label}
          </Link>
        ))}
      </nav>
    </Sheet>
  );
}
