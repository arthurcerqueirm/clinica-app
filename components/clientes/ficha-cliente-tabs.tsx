"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Segmentado } from "@/components/ui/segmentado";
import { CentavosAnimados } from "@/components/ui/numero-animado";
import { RegistrarPagamentoSheet } from "@/components/financeiro/registrar-pagamento-sheet";
import { NovaCobrancaAvulsaSheet } from "@/components/financeiro/nova-cobranca-avulsa-sheet";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { suave } from "@/lib/motion";
import type { FichaCliente } from "@/lib/data/clientes";

const ABAS = [
  { valor: "resumo", label: "Resumo" },
  { valor: "historico", label: "Histórico" },
  { valor: "financeiro", label: "Financeiro" },
  { valor: "pacotes", label: "Pacotes" },
] as const;
type Aba = (typeof ABAS)[number]["valor"];

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
  const [aba, setAba] = useState<Aba>("resumo");
  const [direcao, setDirecao] = useState(1);

  function trocar(nova: Aba) {
    const de = ABAS.findIndex((a) => a.valor === aba);
    const para = ABAS.findIndex((a) => a.valor === nova);
    setDirecao(para >= de ? 1 : -1);
    setAba(nova);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Segmentado
        id="abas-ficha"
        opcoes={ABAS}
        valor={aba}
        onChange={trocar}
        className="surgir mx-4 mt-4"
      />

      <div className="relative flex-1 overflow-hidden px-4 py-4">
        <AnimatePresence mode="popLayout" initial={false} custom={direcao}>
          <motion.div
            key={aba}
            custom={direcao}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: 28 * d }),
              centro: { opacity: 1, x: 0 },
              sai: (d: number) => ({ opacity: 0, x: -28 * d }),
            }}
            initial="entra"
            animate="centro"
            exit="sai"
            transition={suave}
          >
            {aba === "resumo" && <AbaResumo ficha={ficha} />}
            {aba === "historico" && <AbaHistorico ficha={ficha} />}
            {aba === "financeiro" && <AbaFinanceiro ficha={ficha} />}
            {aba === "pacotes" && <AbaPacotes ficha={ficha} />}
          </motion.div>
        </AnimatePresence>
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
        <Card className="bg-primary-soft border-primary/20">
          <p className="text-[13px] font-medium text-primary">Próximo agendamento</p>
          <p className="mt-1 text-[16px] font-semibold text-text">
            {proximoAgendamento.servicos?.nome ?? "Serviço"}
          </p>
          <p className="text-[13px] text-text-muted">
            {formatarDataHora(proximoAgendamento.inicio)}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card indice={1}>
          <p className="text-[13px] font-medium text-text-muted">Saldo devedor</p>
          <CentavosAnimados
            valor={saldoDevedor}
            className={`mt-1 block text-[18px] font-bold ${saldoDevedor > 0 ? "text-danger" : "text-success"}`}
          />
        </Card>
        <Card indice={2}>
          <p className="text-[13px] font-medium text-text-muted">Total gasto</p>
          <CentavosAnimados
            valor={ficha.saldo?.total_pago ?? 0}
            className="mt-1 block text-[18px] font-bold text-text"
          />
        </Card>
        <Card indice={3}>
          <p className="text-[13px] font-medium text-text-muted">Atendimentos</p>
          <p className="mt-1 text-[18px] font-bold text-text">{totalAtendimentos}</p>
        </Card>
        <Card indice={4}>
          <p className="text-[13px] font-medium text-text-muted">Pacotes ativos</p>
          <p className="mt-1 text-[18px] font-bold text-text">
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
      {ficha.agendamentos.map((agendamento, indice) => (
        <Card key={agendamento.id} indice={indice}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-text">
                {agendamento.servicos?.nome ?? "Serviço"}
              </p>
              <p className="text-[13px] text-text-muted">
                {formatarDataHora(agendamento.inicio)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${COR_STATUS_AGENDAMENTO[agendamento.status]}`}
            >
              {LABEL_STATUS_AGENDAMENTO[agendamento.status]}
            </span>
          </div>
          {agendamento.notas_sessao && (
            <p className="mt-2 rounded-xl bg-surface-alt px-3 py-2 text-[13px] text-text-muted">
              {agendamento.notas_sessao}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

function AbaFinanceiro({ ficha }: { ficha: FichaCliente }) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-text-muted">Saldo devedor</p>
          <CentavosAnimados
            valor={ficha.saldo?.saldo_devedor ?? 0}
            className="mt-1 block text-[22px] font-bold text-danger"
          />
        </div>
        {ficha.cliente && <NovaCobrancaAvulsaSheet clienteId={ficha.cliente.id} />}
      </Card>

      {ficha.cobrancasAbertas.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">Nenhuma cobrança em aberto.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ficha.cobrancasAbertas.map((cobranca, indice) => (
            <Card
              key={cobranca.id}
              indice={indice + 1}
              className="flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-text">{cobranca.descricao}</p>
                {cobranca.vencimento && (
                  <p className="text-[12px] text-text-muted">
                    Vencimento: {formatarData(cobranca.vencimento)}
                  </p>
                )}
                <CentavosAnimados
                  valor={cobranca.restanteCentavos}
                  className="text-[14px] font-semibold text-danger"
                />
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
        transitionTypes={["avancar"]}
        className="pressable flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[13px] font-semibold text-primary"
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
      {ficha.pacotes.map((pacote, indice) => (
        <Card key={pacote.id} indice={indice + 1}>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-text">{pacote.nome}</p>
            <span className="rounded-full bg-surface-alt px-2.5 py-1 text-[12px] font-medium capitalize text-text-muted">
              {pacote.status}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {pacote.pacote_itens.map((item) => (
              <div key={item.id} className="text-[13px] text-text-muted">
                {item.servicos?.nome}: {item.quantidade_usada}/{item.quantidade} usadas
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="crescer-x h-2 rounded-full bg-primary"
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
