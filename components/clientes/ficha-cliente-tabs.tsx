"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RegistrarPagamentoSheet } from "@/components/financeiro/registrar-pagamento-sheet";
import { NovaCobrancaAvulsaSheet } from "@/components/financeiro/nova-cobranca-avulsa-sheet";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData, formatarDataHora } from "@/lib/datas";
import type { FichaCliente } from "@/lib/data/clientes";

const ABAS = ["Resumo", "Histórico", "Financeiro", "Pacotes", "Saúde"] as const;
type Aba = (typeof ABAS)[number];

const LABEL_STATUS_AGENDAMENTO: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

const COR_STATUS_AGENDAMENTO: Record<string, string> = {
  agendado: "bg-primary-soft text-primary",
  confirmado: "bg-primary-soft text-primary",
  concluido: "bg-success/10 text-success",
  cancelado: "bg-border text-text-muted",
  faltou: "bg-danger/10 text-danger",
};

export function FichaClienteTabs({ ficha }: { ficha: FichaCliente }) {
  const [aba, setAba] = useState<Aba>("Resumo");

  return (
    <div className="flex flex-1 flex-col">
      <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4">
        {ABAS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAba(item)}
            className={`no-select shrink-0 border-b-2 px-3 py-2.5 text-[14px] font-medium ${
              aba === item
                ? "border-primary text-primary"
                : "border-transparent text-text-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4">
        {aba === "Resumo" && <AbaResumo ficha={ficha} />}
        {aba === "Histórico" && <AbaHistorico ficha={ficha} />}
        {aba === "Financeiro" && <AbaFinanceiro ficha={ficha} />}
        {aba === "Pacotes" && <AbaPacotes ficha={ficha} />}
        {aba === "Saúde" && <AbaSaude ficha={ficha} />}
      </div>
    </div>
  );
}

function AbaResumo({ ficha }: { ficha: FichaCliente }) {
  const proximoAgendamento = ficha.agendamentos.find(
    (a) => ["agendado", "confirmado"].includes(a.status) && new Date(a.inicio) >= new Date(),
  );
  const totalAtendimentos = ficha.agendamentos.filter((a) => a.status === "concluido").length;
  const saldoDevedor = ficha.saldo?.saldo_devedor ?? 0;

  return (
    <div className="flex flex-col gap-3">
      {proximoAgendamento && (
        <Card>
          <p className="text-[13px] font-medium text-text-muted">Próximo agendamento</p>
          <p className="mt-1 text-[15px] font-semibold text-text">
            {proximoAgendamento.servicos?.nome ?? "Serviço"}
          </p>
          <p className="text-[13px] text-text-muted">
            {formatarDataHora(proximoAgendamento.inicio)}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[13px] font-medium text-text-muted">Saldo devedor</p>
          <p
            className={`mt-1 text-[17px] font-semibold ${saldoDevedor > 0 ? "text-danger" : "text-success"}`}
          >
            {formatarCentavos(saldoDevedor)}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-text-muted">Total gasto</p>
          <p className="mt-1 text-[17px] font-semibold text-text">
            {formatarCentavos(ficha.saldo?.total_pago ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-text-muted">Atendimentos</p>
          <p className="mt-1 text-[17px] font-semibold text-text">{totalAtendimentos}</p>
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-text-muted">Pacotes ativos</p>
          <p className="mt-1 text-[17px] font-semibold text-text">
            {ficha.pacotes.filter((p) => p.status === "ativo").length}
          </p>
        </Card>
      </div>
    </div>
  );
}

function AbaHistorico({ ficha }: { ficha: FichaCliente }) {
  if (ficha.agendamentos.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">Nenhum atendimento ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {ficha.agendamentos.map((agendamento) => (
        <Card key={agendamento.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-text">
                {agendamento.servicos?.nome ?? "Serviço"}
              </p>
              <p className="text-[13px] text-text-muted">
                {formatarDataHora(agendamento.inicio)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${COR_STATUS_AGENDAMENTO[agendamento.status]}`}
            >
              {LABEL_STATUS_AGENDAMENTO[agendamento.status]}
            </span>
          </div>
          {agendamento.notas_sessao && (
            <p className="mt-2 text-[13px] text-text-muted">{agendamento.notas_sessao}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

function AbaFinanceiro({ ficha }: { ficha: FichaCliente }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <p className="text-[13px] font-medium text-text-muted">Saldo devedor</p>
        <p className="mt-1 text-[20px] font-semibold text-danger">
          {formatarCentavos(ficha.saldo?.saldo_devedor ?? 0)}
        </p>
      </Card>

      {ficha.cliente && (
        <div className="flex justify-end">
          <NovaCobrancaAvulsaSheet clienteId={ficha.cliente.id} />
        </div>
      )}

      {ficha.cobrancasAbertas.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Nenhuma cobrança em aberto.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ficha.cobrancasAbertas.map((cobranca) => (
            <Card key={cobranca.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] text-text">{cobranca.descricao}</p>
                {cobranca.vencimento && (
                  <p className="text-[12px] text-text-muted">
                    Vencimento: {formatarData(cobranca.vencimento)}
                  </p>
                )}
                <span className="text-[14px] font-medium text-danger">
                  {formatarCentavos(cobranca.restanteCentavos)}
                </span>
              </div>
              <RegistrarPagamentoSheet cobranca={cobranca} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AbaPacotes({ ficha }: { ficha: FichaCliente }) {
  const linkNovoPacote = ficha.cliente && (
    <div className="flex justify-end">
      <Link
        href={`/financeiro/pacotes/novo?cliente=${ficha.cliente.id}`}
        className="flex items-center gap-1.5 text-[13px] font-medium text-primary"
      >
        <Plus size={15} />
        Novo pacote
      </Link>
    </div>
  );

  if (ficha.pacotes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {linkNovoPacote}
        <p className="py-8 text-center text-sm text-text-muted">Nenhum pacote ainda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {linkNovoPacote}
      {ficha.pacotes.map((pacote) => (
        <Card key={pacote.id}>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium text-text">{pacote.nome}</p>
            <span className="text-[12px] font-medium text-text-muted capitalize">
              {pacote.status}
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {pacote.pacote_itens.map((item) => (
              <div key={item.id} className="text-[13px] text-text-muted">
                {item.servicos?.nome}: {item.quantidade_usada}/{item.quantidade} usadas
                <div className="mt-1 h-1.5 w-full rounded-full bg-surface-alt">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (item.quantidade_usada / item.quantidade) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function AbaSaude({ ficha }: { ficha: FichaCliente }) {
  const { cliente } = ficha;
  if (!cliente) return null;

  const semNadaRegistrado =
    !cliente.restricoes_saude && !cliente.alergias && !cliente.preferencias;

  if (semNadaRegistrado) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Nada registrado. Edite a cliente para adicionar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cliente.restricoes_saude && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-[13px] font-semibold text-warning">Restrições de saúde</p>
          <p className="mt-1 text-[14px] text-text">{cliente.restricoes_saude}</p>
        </Card>
      )}
      {cliente.alergias && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-[13px] font-semibold text-warning">Alergias</p>
          <p className="mt-1 text-[14px] text-text">{cliente.alergias}</p>
        </Card>
      )}
      {cliente.preferencias && (
        <Card>
          <p className="text-[13px] font-semibold text-text-muted">Preferências</p>
          <p className="mt-1 text-[14px] text-text">{cliente.preferencias}</p>
        </Card>
      )}
    </div>
  );
}
