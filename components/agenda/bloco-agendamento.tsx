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
        style={{ top, height: altura, backgroundColor: `${cor}1a`, borderColor: cor }}
        className={cn(
          "absolute z-10 overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left leading-tight",
          compacto ? "text-[10px]" : "text-[12px]",
          className,
        )}
      >
        {!compacto && (
          <p className="truncate font-medium text-text">{agendamento.clientes?.nome ?? "Cliente"}</p>
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
