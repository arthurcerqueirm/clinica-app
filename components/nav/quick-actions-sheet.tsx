"use client";

import { Drawer } from "vaul";
import Link from "next/link";
import {
  CalendarPlus,
  UserPlus,
  Receipt,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)] outline-none">
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
          <Drawer.Title className="px-6 pt-4 pb-2 text-base font-semibold text-text">
            Ação rápida
          </Drawer.Title>
          <nav className="flex flex-col px-2 pb-2">
            {acoes.map((acao) => (
              <Link
                key={acao.href}
                href={acao.href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-text active:bg-surface-alt"
              >
                <acao.icone size={20} className="text-primary" />
                {acao.label}
              </Link>
            ))}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
