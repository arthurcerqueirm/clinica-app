import { createClient } from "@/lib/supabase/server";

export const MENSAGEM_COBRANCA_PADRAO =
  "Oi {nome}, tudo bem? 😊 Passando para lembrar do valor de {valor} referente aos nossos últimos atendimentos. Pode pagar no PIX {chave_pix}. Qualquer dúvida me chama!";

export async function buscarConfiguracaoCobranca() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .in("chave", ["mensagem_cobranca", "chave_pix"]);

  const mapa = new Map((data ?? []).map((item) => [item.chave, item.valor]));
  const mensagemValor = mapa.get("mensagem_cobranca") as { texto?: string } | null;
  const pixValor = mapa.get("chave_pix") as { valor?: string } | null;

  return {
    mensagem: mensagemValor?.texto ?? MENSAGEM_COBRANCA_PADRAO,
    chavePix: pixValor?.valor ?? "",
  };
}

export type FaixaGradeAgenda = { inicio: string; fim: string };

const FAIXA_GRADE_PADRAO: FaixaGradeAgenda = { inicio: "07:00", fim: "20:00" };

// Só controla quantas linhas a grade da agenda (Dia/Semana) desenha — não é a
// mesma coisa que `horarios_atendimento` (que já existe, por dia da semana, e
// define de verdade quando dá pra agendar). Ver PLANO.md — Fase 6.
export async function buscarFaixaGradeAgenda(): Promise<FaixaGradeAgenda> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "agenda_grade")
    .maybeSingle();

  const valor = data?.valor as Partial<FaixaGradeAgenda> | null;
  return {
    inicio: valor?.inicio ?? FAIXA_GRADE_PADRAO.inicio,
    fim: valor?.fim ?? FAIXA_GRADE_PADRAO.fim,
  };
}

export type PrefsNotificacao = Record<string, { ativo: boolean }>;

export async function buscarPrefsNotificacao(): Promise<PrefsNotificacao> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "notificacoes_prefs")
    .maybeSingle();

  return (data?.valor as PrefsNotificacao | null) ?? {};
}
