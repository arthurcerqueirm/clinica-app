import { createClient } from "@/lib/supabase/server";
import { hojeISOemSaoPaulo } from "@/lib/datas";

export async function listarDespesas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("despesas")
    .select("*, categorias_despesa(nome, cor)")
    .order("ativa", { ascending: false })
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function listarCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias_despesa").select("*").order("nome");
  return data ?? [];
}

export async function listarOcorrenciasPendentes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("despesas_ocorrencias")
    .select("*, despesas(descricao, categoria_id, categorias_despesa(nome, cor))")
    .eq("pago", false)
    .order("vencimento");
  return data ?? [];
}

/** IDs de despesa que já têm ocorrência lançada (paga ou não) na competência atual. */
export async function listarDespesaIdsComOcorrenciaEsteMes(): Promise<Set<string>> {
  const supabase = await createClient();
  const competenciaAtual = `${hojeISOemSaoPaulo().slice(0, 7)}-01`;

  const { data } = await supabase
    .from("despesas_ocorrencias")
    .select("despesa_id")
    .eq("competencia", competenciaAtual);

  return new Set((data ?? []).map((o) => o.despesa_id));
}
