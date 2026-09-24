"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { formatarCentavos } from "@/lib/dinheiro";
import { alternarAtivoServicoAction, moverServicoAction } from "@/lib/actions/servicos";
import type { Tables } from "@/types/database";

type Servico = Tables<"servicos">;

export function ServicosList({ servicos }: { servicos: Servico[] }) {
  const [, startTransition] = useTransition();

  if (servicos.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-text-muted">
        Nenhum serviço cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {servicos.map((servico, indice) => (
        <div key={servico.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className="h-9 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: servico.cor }}
            aria-hidden
          />

          <div className={`min-w-0 flex-1 ${servico.ativo ? "" : "opacity-50"}`}>
            <p className="truncate text-[15px] font-medium text-text">{servico.nome}</p>
            <p className="text-[13px] text-text-muted">
              {servico.duracao_min} min · {formatarCentavos(servico.preco_centavos)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={indice === 0}
              onClick={() => startTransition(() => moverServicoAction(servico.id, "cima"))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted disabled:opacity-30"
              aria-label="Mover para cima"
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              disabled={indice === servicos.length - 1}
              onClick={() => startTransition(() => moverServicoAction(servico.id, "baixo"))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted disabled:opacity-30"
              aria-label="Mover para baixo"
            >
              <ChevronDown size={18} />
            </button>
            <Link
              href={`/ajustes/servicos/${servico.id}/editar`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted"
              aria-label="Editar"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() =>
                startTransition(() => alternarAtivoServicoAction(servico.id, !servico.ativo))
              }
              className="ml-1 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-text-muted"
            >
              {servico.ativo ? "Ativo" : "Inativo"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
