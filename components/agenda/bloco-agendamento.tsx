"use client";

import { useState } from "react";
import { SheetAgendamento } from "@/components/agenda/sheet-agendamento";
import { cn } from "@/lib/cn";
import { formatarHora } from "@/lib/datas";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

export function BlocoAgendamento({
  agendamento,
  top,
  altura,
  compacto,
  className,
}: {
  agendamento: AgendamentoDoDia;
  top: number;
  altura: number;
  compacto?: boolean;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const cor = agendamento.servicos?.cor ?? "#8B7CF6";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ top, height: altura, backgroundColor: `${cor}24`, borderColor: cor }}
        className={cn(
          "surgir pressable absolute z-10 overflow-hidden border-l-[3px] text-left leading-tight shadow-(--shadow-sm)",
          compacto ? "rounded-md px-1 py-0.5 text-[10px]" : "rounded-xl px-2.5 py-1.5 text-[12px]",
          className,
        )}
      >
        {!compacto && (
          <p className="truncate font-semibold text-text">{agendamento.clientes?.nome ?? "Cliente"}</p>
        )}
        <p className={cn("truncate text-text-muted", compacto && "font-medium text-text")}>
          {formatarHora(agendamento.inicio)}
          {!compacto && agendamento.servicos?.nome ? ` · ${agendamento.servicos.nome}` : ""}
        </p>
      </button>

      <SheetAgendamento aberto={aberto} onOpenChange={setAberto} agendamento={agendamento} />
    </>
  );
}
