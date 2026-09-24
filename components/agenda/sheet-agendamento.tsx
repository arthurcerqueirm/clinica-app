"use client";

import { useTransition } from "react";
import { Drawer } from "vaul";
import { CheckCircle2, MessageCircle, Check, X, UserX } from "lucide-react";
import { formatarHora } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/whatsapp";
import { mudarStatusAgendamentoAction } from "@/lib/actions/agendamentos";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

export function SheetAgendamento({
  aberto,
  onOpenChange,
  agendamento,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  agendamento: AgendamentoDoDia;
}) {
  const [, startTransition] = useTransition();
  const telefone = agendamento.clientes?.telefone;

  function mudarStatus(status: "confirmado" | "concluido" | "cancelado" | "faltou") {
    startTransition(() => mudarStatusAgendamentoAction(agendamento.id, status));
    onOpenChange(false);
  }

  return (
    <Drawer.Root open={aberto} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)] outline-none">
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
          <Drawer.Title className="px-6 pt-4 pb-1 text-base font-semibold text-text">
            {agendamento.clientes?.nome}
          </Drawer.Title>
          <Drawer.Description className="px-6 pb-3 text-[13px] text-text-muted">
            {agendamento.servicos?.nome} · {formatarHora(agendamento.inicio)}
          </Drawer.Description>

          <nav className="flex flex-col px-2 pb-2">
            {telefone && (
              <a
                href={linkWhatsApp(telefone)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-text active:bg-surface-alt"
              >
                <MessageCircle size={20} className="text-success" />
                Abrir WhatsApp
              </a>
            )}
            {agendamento.status === "agendado" && (
              <ItemAcao icone={Check} label="Confirmar" onClick={() => mudarStatus("confirmado")} />
            )}
            {agendamento.status !== "concluido" && agendamento.status !== "cancelado" && (
              <ItemAcao
                icone={CheckCircle2}
                label="Concluir atendimento"
                onClick={() => mudarStatus("concluido")}
              />
            )}
            {agendamento.status !== "cancelado" && agendamento.status !== "concluido" && (
              <ItemAcao icone={UserX} label="Marcar falta" onClick={() => mudarStatus("faltou")} />
            )}
            {agendamento.status !== "cancelado" && (
              <ItemAcao
                icone={X}
                label="Cancelar agendamento"
                destrutivo
                onClick={() => mudarStatus("cancelado")}
              />
            )}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ItemAcao({
  icone: Icone,
  label,
  onClick,
  destrutivo,
}: {
  icone: typeof Check;
  label: string;
  onClick: () => void;
  destrutivo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] active:bg-surface-alt ${
        destrutivo ? "text-danger" : "text-text"
      }`}
    >
      <Icone size={20} className={destrutivo ? "text-danger" : "text-primary"} />
      {label}
    </button>
  );
}
