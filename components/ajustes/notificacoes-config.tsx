"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Share, PlusSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ehIOS,
  ehStandalone,
  suportaPush,
  buscarInscricaoAtual,
  inscreverPush,
  paraJSON,
} from "@/lib/push/subscribe";
import {
  salvarInscricaoPushAction,
  removerInscricaoPushAction,
  enviarNotificacaoTesteAction,
} from "@/lib/actions/push";
import { salvarPrefNotificacaoAction } from "@/lib/actions/configuracoes";
import type { PrefsNotificacao } from "@/lib/data/configuracoes";

const TIPOS_NOTIFICACAO = [
  { chave: "lembrete_agendamento", label: "Lembrete de atendimento", desc: "1h antes de cada atendimento" },
  { chave: "resumo_diario", label: "Resumo do dia", desc: "Todos os dias às 7h" },
  { chave: "cobranca_pendente", label: "Cobrança pendente", desc: "Clientes devendo há mais de 15 dias" },
  { chave: "despesa_vencendo", label: "Despesa vencendo", desc: "3 dias antes do vencimento" },
  { chave: "pacote_expirando", label: "Pacote expirando", desc: "7 dias antes de vencer" },
  { chave: "fechamento_semanal", label: "Fechamento semanal", desc: "Domingo às 20h" },
  { chave: "cliente_inativa", label: "Cliente inativa", desc: "Sem retorno há mais de 60 dias" },
  { chave: "aniversario", label: "Aniversário", desc: "No dia do aniversário da cliente" },
] as const;

type Status = "verificando" | "ativado" | "desativado" | "sem_suporte" | "ios_nao_instalado";

export function NotificacoesConfig({ prefsIniciais }: { prefsIniciais: PrefsNotificacao }) {
  const [status, setStatus] = useState<Status>("verificando");
  const [inscricaoEndpoint, setInscricaoEndpoint] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(prefsIniciais);
  const [pendente, startTransition] = useTransition();
  const [mensagemTeste, setMensagemTeste] = useState<string | null>(null);

  useEffect(() => {
    async function verificar() {
      if (!suportaPush()) {
        setStatus("sem_suporte");
        return;
      }
      if (ehIOS() && !ehStandalone()) {
        setStatus("ios_nao_instalado");
        return;
      }
      const inscricao = await buscarInscricaoAtual();
      if (inscricao) {
        setInscricaoEndpoint(inscricao.endpoint);
        setStatus("ativado");
      } else {
        setStatus("desativado");
      }
    }
    verificar();
  }, []);

  async function ativar() {
    const resultado = await inscreverPush();
    if (!resultado.ok) {
      if (resultado.motivo === "permissao_negada") {
        setMensagemTeste("Permissão negada. Ative nas configurações do navegador.");
      } else if (resultado.motivo === "ios_nao_instalado") {
        setStatus("ios_nao_instalado");
      } else {
        setMensagemTeste("Não foi possível ativar as notificações.");
      }
      return;
    }

    const json = paraJSON(resultado.subscription);
    await salvarInscricaoPushAction({ ...json, userAgent: navigator.userAgent });
    setInscricaoEndpoint(json.endpoint);
    setStatus("ativado");
  }

  async function desativar() {
    if (!inscricaoEndpoint) return;
    const inscricao = await buscarInscricaoAtual();
    await inscricao?.unsubscribe();
    await removerInscricaoPushAction(inscricaoEndpoint);
    setInscricaoEndpoint(null);
    setStatus("desativado");
  }

  function testar() {
    setMensagemTeste(null);
    startTransition(async () => {
      try {
        await enviarNotificacaoTesteAction();
        setMensagemTeste("Enviada! Deve chegar em alguns segundos.");
      } catch {
        setMensagemTeste("Não foi possível enviar a notificação de teste.");
      }
    });
  }

  function alternarTipo(tipo: string, ativo: boolean) {
    setPrefs((atual) => ({ ...atual, [tipo]: { ativo } }));
    startTransition(() => salvarPrefNotificacaoAction(tipo, ativo));
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              status === "ativado" ? "bg-success/10 text-success" : "bg-surface-alt text-text-muted"
            }`}
          >
            {status === "ativado" ? <Bell size={19} /> : <BellOff size={19} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-text">
              {status === "verificando" && "Verificando..."}
              {status === "ativado" && "Notificações ativadas"}
              {status === "desativado" && "Notificações desativadas"}
              {status === "sem_suporte" && "Não suportado neste navegador"}
              {status === "ios_nao_instalado" && "Precisa instalar o app primeiro"}
            </p>
          </div>
        </div>

        {status === "desativado" && (
          <Button onClick={ativar} className="mt-3 w-full">
            Ativar notificações
          </Button>
        )}
        {status === "ativado" && (
          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={testar} disabled={pendente} variante="secondary" className="w-full">
              <Send size={16} className="mr-2" />
              {pendente ? "Enviando..." : "Enviar notificação de teste"}
            </Button>
            <button
              type="button"
              onClick={desativar}
              className="text-[13px] font-medium text-danger"
            >
              Desativar
            </button>
          </div>
        )}
        {mensagemTeste && <p className="mt-2 text-[13px] text-text-muted">{mensagemTeste}</p>}

        {status === "ios_nao_instalado" && <GuiaInstalacaoIOS />}
      </div>

      {status === "ativado" && (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
          {TIPOS_NOTIFICACAO.map((tipo) => (
            <label
              key={tipo.chave}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-text">{tipo.label}</p>
                <p className="text-[12px] text-text-muted">{tipo.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs[tipo.chave]?.ativo ?? true}
                onChange={(e) => alternarTipo(tipo.chave, e.target.checked)}
                className="h-5 w-9 shrink-0 accent-primary"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function GuiaInstalacaoIOS() {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-primary-soft p-3 text-[13px] text-text">
      <p className="font-medium text-primary">Como instalar no iPhone:</p>
      <p className="flex items-center gap-1.5">
        1. Toque em <Share size={14} className="inline text-primary" /> (Compartilhar) no Safari
      </p>
      <p className="flex items-center gap-1.5">
        2. Toque em <PlusSquare size={14} className="inline text-primary" /> &ldquo;Adicionar à
        Tela de Início&rdquo;
      </p>
      <p>3. Abra o app pelo ícone na tela inicial e volte aqui</p>
    </div>
  );
}
