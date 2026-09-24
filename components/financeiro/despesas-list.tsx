"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {ocorrenciasPendentes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
            Pendentes
          </h2>
          {ocorrenciasPendentes.map((ocorrencia) => (
            <Card key={ocorrencia.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-text">
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
        </section>
      )}

      {despesasFixasSemOcorrenciaEsteMes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
            Sem lançamento este mês
          </h2>
          {despesasFixasSemOcorrenciaEsteMes.map((despesa) => (
            <GerarOcorrenciaCard key={despesa.id} despesa={despesa} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Todas as despesas
        </h2>
        {despesas.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            Nenhuma despesa cadastrada ainda.
          </p>
        ) : (
          despesas.map((despesa) => <DespesaCard key={despesa.id} despesa={despesa} />)
        )}
      </section>
    </div>
  );
}

function GerarOcorrenciaCard({ despesa }: { despesa: Despesa }) {
  const [pendente, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-text">{despesa.descricao}</p>
        <p className="text-[12px] text-text-muted">
          Dia {despesa.dia_vencimento} · {formatarCentavos(despesa.valor_centavos)}
        </p>
      </div>
      <button
        type="button"
        disabled={pendente}
        onClick={() => startTransition(() => gerarOcorrenciaMesAtualAction(despesa.id))}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-medium text-primary"
      >
        <RefreshCw size={14} />
        Lançar este mês
      </button>
    </Card>
  );
}

function DespesaCard({ despesa }: { despesa: Despesa }) {
  const [pendente, startTransition] = useTransition();

  return (
    <Card className={`flex items-center justify-between gap-2 ${despesa.ativa ? "" : "opacity-50"}`}>
      <div className="min-w-0">
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
          style={{ backgroundColor: despesa.categorias_despesa?.cor ?? "#94A3B8" }}
        />
        <span className="text-[14px] font-medium text-text">{despesa.descricao}</span>
        <p className="text-[12px] text-text-muted">
          {despesa.tipo === "fixa" ? `Fixa · dia ${despesa.dia_vencimento}` : "Ocasional"} ·{" "}
          {formatarCentavos(despesa.valor_centavos)}
        </p>
      </div>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          startTransition(() => alternarAtivaDespesaAction(despesa.id, !despesa.ativa))
        }
        className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-text-muted"
      >
        {despesa.ativa ? "Ativa" : "Inativa"}
      </button>
    </Card>
  );
}
