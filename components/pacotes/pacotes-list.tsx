"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData } from "@/lib/datas";
import { cancelarPacoteAction } from "@/lib/actions/pacotes";
import type { PacoteResumido } from "@/lib/data/pacotes";

const LABEL_STATUS: Record<string, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

const COR_STATUS: Record<string, string> = {
  ativo: "bg-primary-soft text-primary",
  concluido: "bg-success/10 text-success",
  expirado: "bg-warning/10 text-warning",
  cancelado: "bg-border text-text-muted",
};

export function PacotesList({ pacotes }: { pacotes: PacoteResumido[] }) {
  if (pacotes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Package size={26} />
        </div>
        <h2 className="text-lg font-semibold text-text">Nenhum pacote ainda</h2>
        <p className="max-w-xs text-sm text-text-muted">
          Toque no botão + para montar um pacote pra alguma cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {pacotes.map((pacote) => (
        <PacoteCard key={pacote.id} pacote={pacote} />
      ))}
    </div>
  );
}

function PacoteCard({ pacote }: { pacote: PacoteResumido }) {
  const [pendente, startTransition] = useTransition();

  const totalItens = pacote.pacote_itens.reduce((soma, i) => soma + i.quantidade, 0);
  const totalUsado = pacote.pacote_itens.reduce((soma, i) => soma + i.quantidade_usada, 0);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {pacote.clientes && (
            <Link
              href={`/clientes/${pacote.clientes.id}`}
              className="text-[13px] font-medium text-primary"
            >
              {pacote.clientes.nome}
            </Link>
          )}
          <p className="truncate text-[15px] font-medium text-text">{pacote.nome}</p>
          <p className="text-[12px] text-text-muted">
            {totalUsado}/{totalItens} sessões usadas
            {pacote.validade && ` · válido até ${formatarData(pacote.validade)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${COR_STATUS[pacote.status]}`}
          >
            {LABEL_STATUS[pacote.status]}
          </span>
          <span className="text-[13px] font-semibold text-text">
            {formatarCentavos(pacote.valor_final_centavos)}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface-alt">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${totalItens > 0 ? Math.min(100, (totalUsado / totalItens) * 100) : 0}%` }}
        />
      </div>

      {pacote.status === "ativo" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => cancelarPacoteAction(pacote.id))}
          className="self-start text-[12px] font-medium text-danger"
        >
          Cancelar pacote
        </button>
      )}
    </Card>
  );
}
