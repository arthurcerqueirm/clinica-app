"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, HandCoins } from "lucide-react";
import { formatarCentavos } from "@/lib/dinheiro";
import { linkWhatsApp, montarMensagemCobranca } from "@/lib/whatsapp";
import { buscarCobrancasClienteAction } from "@/lib/actions/pagamentos";
import { RegistrarPagamentoSheet } from "@/components/financeiro/registrar-pagamento-sheet";
import type { CobrancaComSaldo } from "@/lib/data/pagamentos";
import type { Tables } from "@/types/database";

type Inadimplente = Tables<"vw_saldo_cliente">;

export function InadimplentesList({
  inadimplentes,
  mensagemTemplate,
  chavePix,
}: {
  inadimplentes: Inadimplente[];
  mensagemTemplate: string;
  chavePix: string;
}) {
  const [agora] = useState(() => Date.now());

  if (inadimplentes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 py-16 text-center">
        <HandCoins size={26} className="text-success" />
        <p className="text-[15px] font-medium text-text">Ninguém devendo</p>
        <p className="text-[13px] text-text-muted">Todas as cobranças estão em dia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border px-4">
      {inadimplentes.map((item) => (
        <LinhaInadimplente
          key={item.cliente_id}
          item={item}
          mensagemTemplate={mensagemTemplate}
          chavePix={chavePix}
          agora={agora}
        />
      ))}
    </div>
  );
}

function LinhaInadimplente({
  item,
  mensagemTemplate,
  chavePix,
  agora,
}: {
  item: Inadimplente;
  mensagemTemplate: string;
  chavePix: string;
  agora: number;
}) {
  const [expandido, setExpandido] = useState(false);
  const [cobrancas, setCobrancas] = useState<CobrancaComSaldo[] | null>(null);
  const [carregando, setCarregando] = useState(false);

  const dias = diasEmAtraso(item.vencimento_mais_antigo, agora);
  const { cor, label } = corPorDias(dias);

  async function alternarExpandido() {
    if (!expandido && cobrancas === null && item.cliente_id) {
      setCarregando(true);
      const lista = await buscarCobrancasClienteAction(item.cliente_id);
      setCobrancas(lista);
      setCarregando(false);
    }
    setExpandido((v) => !v);
  }

  const mensagem = montarMensagemCobranca(mensagemTemplate, {
    nome: (item.nome ?? "").split(" ")[0],
    valor: formatarCentavos(item.saldo_devedor ?? 0),
    dias,
    chavePix,
  });

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor}`} aria-hidden />
        <button
          type="button"
          onClick={alternarExpandido}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-text">{item.nome}</p>
            <p className="text-[13px] text-text-muted">
              vencido há {dias} {dias === 1 ? "dia" : "dias"} · {label}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[15px] font-semibold text-danger">
              {formatarCentavos(item.saldo_devedor ?? 0)}
            </span>
            <ChevronDown
              size={16}
              className={`text-text-muted transition-transform ${expandido ? "rotate-180" : ""}`}
            />
          </div>
        </button>
      </div>

      <div className="mt-2 flex gap-2 pl-5">
        {item.telefone && (
          <a
            href={linkWhatsApp(item.telefone, mensagem)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[13px] font-medium text-success"
          >
            <MessageCircle size={14} />
            Cobrar
          </a>
        )}
      </div>

      {expandido && (
        <div className="mt-2 flex flex-col gap-2 pl-5">
          {carregando && <p className="text-[13px] text-text-muted">Carregando...</p>}
          {cobrancas?.map((cobranca) => (
            <div
              key={cobranca.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] text-text">{cobranca.descricao}</p>
                <p className="text-[12px] text-text-muted">
                  {formatarCentavos(cobranca.restanteCentavos)}
                </p>
              </div>
              <RegistrarPagamentoSheet cobranca={cobranca} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function diasEmAtraso(vencimento: string | null, agora: number): number {
  if (!vencimento) return 0;
  const ms = agora - new Date(`${vencimento}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function corPorDias(dias: number): { cor: string; label: string } {
  if (dias > 60) return { cor: "bg-danger", label: "atenção" };
  if (dias > 30) return { cor: "bg-warning", label: "vencido" };
  if (dias > 0) return { cor: "bg-accent", label: "recente" };
  return { cor: "bg-primary", label: "em dia" };
}
