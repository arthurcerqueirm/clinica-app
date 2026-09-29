"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
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
      <PlaceholderScreen
        icone={Package}
        titulo="Nenhum pacote ainda"
        descricao="Toque no botão + para montar um pacote pra alguma cliente."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-2">
      {pacotes.map((pacote, indice) => (
        <PacoteCard key={pacote.id} pacote={pacote} indice={indice} />
      ))}
    </div>
  );
}

function PacoteCard({ pacote, indice }: { pacote: PacoteResumido; indice: number }) {
  const [pendente, startTransition] = useTransition();

  const totalItens = pacote.pacote_itens.reduce((soma, i) => soma + i.quantidade, 0);
  const totalUsado = pacote.pacote_itens.reduce((soma, i) => soma + i.quantidade_usada, 0);

  return (
    <Card indice={indice} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {pacote.clientes && (
            <Link
              href={`/clientes/${pacote.clientes.id}`}
              transitionTypes={["avancar"]}
              className="text-[13px] font-semibold text-primary"
            >
              {pacote.clientes.nome}
            </Link>
          )}
          <p className="truncate text-[15px] font-semibold text-text">{pacote.nome}</p>
          <p className="text-[12px] text-text-muted">
            {totalUsado}/{totalItens} sessões usadas
            {pacote.validade && ` · válido até ${formatarData(pacote.validade)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${COR_STATUS[pacote.status]}`}
          >
            {LABEL_STATUS[pacote.status]}
          </span>
          <span className="text-[14px] font-bold text-text">
            {formatarCentavos(pacote.valor_final_centavos)}
          </span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="crescer-x h-2 rounded-full bg-primary"
          style={{ width: `${totalItens > 0 ? Math.min(100, (totalUsado / totalItens) * 100) : 0}%` }}
        />
      </div>

      {pacote.status === "ativo" && (
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => cancelarPacoteAction(pacote.id))}
          className="pressable self-start rounded-full bg-danger/10 px-3 py-1.5 text-[12px] font-semibold text-danger disabled:opacity-60"
        >
          {pendente ? "Cancelando..." : "Cancelar pacote"}
        </button>
      )}
    </Card>
  );
}
