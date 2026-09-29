"use client";

import { useTransition } from "react";
import { RefreshCw, Receipt } from "lucide-react";
import { Card, TituloSecao } from "@/components/ui/card";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { MarcarOcorrenciaPagaSheet } from "@/components/financeiro/marcar-ocorrencia-paga-sheet";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData } from "@/lib/datas";
import {
  alternarAtivaDespesaAction,
  gerarOcorrenciaMesAtualAction,
} from "@/lib/actions/despesas";
import type { listarDespesas, listarOcorrenciasPendentes } from "@/lib/data/despesas";

type Despesa = Awaited<ReturnType<typeof listarDespesas>>[number];
type Ocorrencia = Awaited<ReturnType<typeof listarOcorrenciasPendentes>>[number];

export function DespesasList({
  despesas,
  ocorrenciasPendentes,
  despesaIdsComOcorrenciaEsteMes,
}: {
  despesas: Despesa[];
  ocorrenciasPendentes: Ocorrencia[];
  despesaIdsComOcorrenciaEsteMes: string[];
}) {
  const jaLancadas = new Set(despesaIdsComOcorrenciaEsteMes);
  const despesasFixasSemOcorrenciaEsteMes = despesas.filter(
    (d) => d.ativa && d.tipo === "fixa" && !jaLancadas.has(d.id),
  );

  if (despesas.length === 0 && ocorrenciasPendentes.length === 0) {
    return (
      <PlaceholderScreen
        icone={Receipt}
        titulo="Nenhuma despesa cadastrada"
        descricao="Toque no + para registrar aluguel, produtos e outros gastos."
      />
    );
  }

  let indice = 0;

  return (
    <div className="flex flex-col pb-4">
      {ocorrenciasPendentes.length > 0 && (
        <section>
          <TituloSecao className="pt-2">Pendentes</TituloSecao>
          <div className="flex flex-col gap-2 px-4">
            {ocorrenciasPendentes.map((ocorrencia) => (
              <Card
                key={ocorrencia.id}
                indice={indice++}
                className="flex items-center justify-between gap-2 border-warning/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-text">
                    {ocorrencia.despesas?.descricao}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Vence {formatarData(ocorrencia.vencimento)} ·{" "}
                    {formatarCentavos(ocorrencia.valor_centavos)}
                  </p>
                </div>
                <MarcarOcorrenciaPagaSheet
                  ocorrenciaId={ocorrencia.id}
                  descricao={ocorrencia.despesas?.descricao ?? ""}
                  valorCentavos={ocorrencia.valor_centavos}
                />
              </Card>
            ))}
          </div>
        </section>
      )}

      {despesasFixasSemOcorrenciaEsteMes.length > 0 && (
        <section>
          <TituloSecao>Sem lançamento este mês</TituloSecao>
          <div className="flex flex-col gap-2 px-4">
            {despesasFixasSemOcorrenciaEsteMes.map((despesa) => (
              <GerarOcorrenciaCard key={despesa.id} despesa={despesa} indice={indice++} />
            ))}
          </div>
        </section>
      )}

      <section>
        <TituloSecao>Todas as despesas</TituloSecao>
        <div className="flex flex-col gap-2 px-4">
          {despesas.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              Nenhuma despesa cadastrada ainda.
            </p>
          )}
          {despesas.map((despesa) => (
            <DespesaCard key={despesa.id} despesa={despesa} indice={indice++} />
          ))}
        </div>
      </section>
    </div>
  );
}

function GerarOcorrenciaCard({ despesa, indice }: { despesa: Despesa; indice: number }) {
  const [pendente, startTransition] = useTransition();

  return (
    <Card indice={indice} className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold text-text">{despesa.descricao}</p>
        <p className="text-[12px] text-text-muted">
          Dia {despesa.dia_vencimento} · {formatarCentavos(despesa.valor_centavos)}
        </p>
      </div>
      <button
        type="button"
        disabled={pendente}
        onClick={() => startTransition(() => gerarOcorrenciaMesAtualAction(despesa.id))}
        className="pressable flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[13px] font-semibold text-primary disabled:opacity-60"
      >
        <RefreshCw size={14} className={pendente ? "animate-spin" : undefined} />
        Lançar este mês
      </button>
    </Card>
  );
}

function DespesaCard({ despesa, indice }: { despesa: Despesa; indice: number }) {
  const [pendente, startTransition] = useTransition();

  return (
    <Card
      indice={indice}
      className={`flex items-center justify-between gap-2 transition-opacity ${despesa.ativa ? "" : "opacity-50"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: despesa.categorias_despesa?.cor ?? "#94A3B8" }}
        />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-text">{despesa.descricao}</p>
          <p className="text-[12px] text-text-muted">
            {despesa.tipo === "fixa" ? `Fixa · dia ${despesa.dia_vencimento}` : "Ocasional"} ·{" "}
            {formatarCentavos(despesa.valor_centavos)}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          startTransition(() => alternarAtivaDespesaAction(despesa.id, !despesa.ativa))
        }
        className="pressable shrink-0 rounded-full border border-border px-3 py-1.5 text-[12px] font-semibold text-text-muted"
      >
        {despesa.ativa ? "Ativa" : "Inativa"}
      </button>
    </Card>
  );
}
