"use client";

import { useTransition } from "react";
import { CheckCircle2, MessageCircle, Check, X, UserX } from "lucide-react";
import { Sheet, ItemSheet } from "@/components/ui/sheet";
import { formatarHora } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/whatsapp";
import { mudarStatusAgendamentoAction } from "@/lib/actions/agendamentos";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

type Status = "confirmado" | "concluido" | "cancelado" | "faltou";

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
  const { status } = agendamento;
  const encerrado = status === "concluido" || status === "cancelado";

  function mudarStatus(novo: Status) {
    startTransition(() => mudarStatusAgendamentoAction(agendamento.id, novo));
    onOpenChange(false);
  }

  const acoes: { icone: typeof Check; label: string; onClick: () => void; destrutivo?: boolean }[] = [];
  if (telefone) {
    acoes.push({
      icone: MessageCircle,
      label: "Abrir WhatsApp",
      onClick: () => window.open(linkWhatsApp(telefone), "_blank", "noreferrer"),
    });
  }
  if (status === "agendado") {
    acoes.push({ icone: Check, label: "Confirmar", onClick: () => mudarStatus("confirmado") });
  }
  if (!encerrado) {
    acoes.push({
      icone: CheckCircle2,
      label: "Concluir atendimento",
      onClick: () => mudarStatus("concluido"),
    });
    acoes.push({ icone: UserX, label: "Marcar falta", onClick: () => mudarStatus("faltou") });
  }
  if (status !== "cancelado") {
    acoes.push({
      icone: X,
      label: "Cancelar agendamento",
      destrutivo: true,
      onClick: () => mudarStatus("cancelado"),
    });
  }

  return (
    <Sheet
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo={agendamento.clientes?.nome}
      descricao={`${agendamento.servicos?.nome ?? ""} · ${formatarHora(agendamento.inicio)}`}
    >
      <nav className="-mx-1 flex flex-col">
        {acoes.map((acao, indice) => (
          <ItemSheet key={acao.label} {...acao} indice={indice + 1} />
        ))}
      </nav>
    </Sheet>
  );
}
