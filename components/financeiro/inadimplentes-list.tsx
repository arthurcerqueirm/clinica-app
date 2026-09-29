"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, ChevronDown, HandCoins } from "lucide-react";
import { Grupo } from "@/components/ui/card";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarCentavos } from "@/lib/dinheiro";
import { linkWhatsApp, montarMensagemCobranca } from "@/lib/whatsapp";
import { buscarCobrancasClienteAction } from "@/lib/actions/pagamentos";
import { RegistrarPagamentoSheet } from "@/components/financeiro/registrar-pagamento-sheet";
import { mola, suave } from "@/lib/motion";
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
      <PlaceholderScreen
        icone={HandCoins}
        titulo="Ninguém devendo"
        descricao="Todas as cobranças estão em dia."
      />
    );
  }

  return (
    <Grupo indice={1}>
      {inadimplentes.map((item) => (
        <LinhaInadimplente
          key={item.cliente_id}
          item={item}
          mensagemTemplate={mensagemTemplate}
          chavePix={chavePix}
          agora={agora}
        />
      ))}
    </Grupo>
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
    const abrir = !expandido;
    setExpandido(abrir);
    if (abrir && cobrancas === null && item.cliente_id) {
      setCarregando(true);
      const lista = await buscarCobrancasClienteAction(item.cliente_id);
      setCobrancas(lista);
      setCarregando(false);
    }
  }

  const mensagem = montarMensagemCobranca(mensagemTemplate, {
    nome: (item.nome ?? "").split(" ")[0],
    valor: formatarCentavos(item.saldo_devedor ?? 0),
    dias,
    chavePix,
  });

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor}`} aria-hidden />
        <button
          type="button"
          onClick={alternarExpandido}
          aria-expanded={expandido}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-text">{item.nome}</p>
            <p className="text-[13px] text-text-muted">
              vencido há {dias} {dias === 1 ? "dia" : "dias"} · {label}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[15px] font-bold text-danger">
              {formatarCentavos(item.saldo_devedor ?? 0)}
            </span>
            <motion.span animate={{ rotate: expandido ? 180 : 0 }} transition={mola}>
              <ChevronDown size={16} className="text-text-muted" />
            </motion.span>
          </div>
        </button>
      </div>

      {item.telefone && (
        <div className="mt-2 flex gap-2 pl-5">
          <a
            href={linkWhatsApp(item.telefone, mensagem)}
            target="_blank"
            rel="noreferrer"
            className="pressable flex items-center gap-1.5 rounded-full bg-success/10 px-3.5 py-2 text-[13px] font-semibold text-success"
          >
            <MessageCircle size={14} />
            Cobrar
          </a>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expandido && (
          <motion.div
            key="cobrancas"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={suave}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-2 pl-5">
              {carregando && <Skeleton className="h-14 w-full rounded-2xl" />}
              {cobrancas?.map((cobranca, indice) => (
                <div
                  key={cobranca.id}
                  style={{ "--i": indice } as React.CSSProperties}
                  className="surgir flex items-center justify-between gap-2 rounded-2xl bg-surface-alt px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text">{cobranca.descricao}</p>
                    <p className="text-[12px] text-text-muted">
                      {formatarCentavos(cobranca.restanteCentavos)}
                    </p>
                  </div>
                  <RegistrarPagamentoSheet cobranca={cobranca} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
