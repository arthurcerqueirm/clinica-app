"use client";

import { useState, useTransition } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { formatarHora } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/whatsapp";
import { mudarStatusAgendamentoAction } from "@/lib/actions/agendamentos";
import { SheetAgendamento } from "@/components/agenda/sheet-agendamento";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

const LABEL_STATUS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

const COR_STATUS: Record<string, string> = {
  agendado: "bg-primary-soft text-primary",
  confirmado: "bg-primary-soft text-primary",
  concluido: "bg-success/10 text-success",
  cancelado: "bg-border text-text-muted",
  faltou: "bg-danger/10 text-danger",
};

export function AgendamentoCard({ agendamento }: { agendamento: AgendamentoDoDia }) {
  const [, startTransition] = useTransition();
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const x = useMotionValue(0);
  const opacidadeWhatsapp = useTransform(x, [20, 100], [0, 1]);
  const opacidadeConcluir = useTransform(x, [-100, -20], [1, 0]);

  const encerrado = agendamento.status === "concluido" || agendamento.status === "cancelado";
  const telefone = agendamento.clientes?.telefone;

  function aoSoltarArraste(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x <= -80 && !encerrado) {
      startTransition(() => mudarStatusAgendamentoAction(agendamento.id, "concluido"));
    } else if (info.offset.x >= 80 && telefone) {
      window.open(linkWhatsApp(telefone), "_blank");
    }
  }

  return (
    <div className="relative mx-4 my-1.5">
      <div className="absolute inset-0 flex items-center justify-between rounded-xl bg-surface-alt px-5">
        <motion.div style={{ opacity: opacidadeWhatsapp }} className="text-success">
          <MessageCircle size={20} />
        </motion.div>
        <motion.div style={{ opacity: opacidadeConcluir }} className="text-success">
          <CheckCircle2 size={20} />
        </motion.div>
      </div>

      <motion.button
        type="button"
        drag={encerrado ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        style={{ x }}
        onDragEnd={aoSoltarArraste}
        onClick={() => setAcoesAbertas(true)}
        className="relative flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-(--shadow-sm)"
      >
        <span
          className="mt-0.5 h-full min-h-10 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: agendamento.servicos?.cor ?? "#8B7CF6" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text-muted">
            {formatarHora(agendamento.inicio)} – {formatarHora(agendamento.fim)}
          </p>
          <p className="truncate text-[15px] font-semibold text-text">
            {agendamento.clientes?.nome ?? "Cliente"}
          </p>
          <p className="truncate text-[13px] text-text-muted">{agendamento.servicos?.nome}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${COR_STATUS[agendamento.status]}`}
        >
          {LABEL_STATUS[agendamento.status]}
        </span>
      </motion.button>

      <SheetAgendamento aberto={acoesAbertas} onOpenChange={setAcoesAbertas} agendamento={agendamento} />
    </div>
  );
}
