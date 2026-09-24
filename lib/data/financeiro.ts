import { createClient } from "@/lib/supabase/server";
import { hojeISOemSaoPaulo } from "@/lib/datas";

export async function buscarResumoMesAtual() {
  const supabase = await createClient();
  const hoje = hojeISOemSaoPaulo();
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const [{ data: pagamentos }, { data: despesasPagas }, { data: saldos }] = await Promise.all([
    supabase
      .from("pagamentos")
      .select("valor_centavos, pago_em")
      .gte("pago_em", `${inicioMes}T00:00:00`),
    supabase
      .from("despesas_ocorrencias")
      .select("valor_centavos")
      .eq("pago", true)
      .gte("competencia", inicioMes),
    supabase.from("vw_saldo_cliente").select("saldo_devedor, cobrancas_abertas"),
  ]);

  const entradas = (pagamentos ?? []).reduce((soma, p) => soma + p.valor_centavos, 0);
  const saidas = (despesasPagas ?? []).reduce((soma, d) => soma + d.valor_centavos, 0);
  const aReceber = (saldos ?? []).reduce((soma, s) => soma + (s.saldo_devedor ?? 0), 0);
  const clientesDevendo = (saldos ?? []).filter((s) => (s.saldo_devedor ?? 0) > 0).length;

  return { entradas, saidas, resultado: entradas - saidas, aReceber, clientesDevendo };
}

export async function buscarEvolucaoMensal(meses = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_fluxo_caixa_mensal")
    .select("*")
    .order("mes", { ascending: false })
    .limit(meses);

  return (data ?? []).reverse();
}

export async function buscarProjecaoAgendada() {
  const supabase = await createClient();
  const hoje = hojeISOemSaoPaulo();
  const { data } = await supabase
    .from("agendamentos")
    .select("valor_cobrado_centavos")
    .in("status", ["agendado", "confirmado"])
    .gte("inicio", `${hoje}T00:00:00`);

  return (data ?? []).reduce((soma, a) => soma + (a.valor_cobrado_centavos ?? 0), 0);
}
