import { createClient } from "@/lib/supabase/server";

export async function listarCreditosDisponiveis(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_creditos_pacote")
    .select("*")
    .eq("cliente_id", clienteId)
    .gt("disponivel", 0);

  return data ?? [];
}

export async function listarModelosPacote() {
  const supabase = await createClient();
  const { data } = await supabase.from("pacote_modelos").select("*").order("nome");
  return data ?? [];
}

export async function listarTodosPacotes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pacotes")
    .select(
      "id, nome, status, validade, valor_final_centavos, criado_em, clientes(id, nome), pacote_itens(quantidade, quantidade_usada)",
    )
    .order("criado_em", { ascending: false });

  return data ?? [];
}

export type PacoteResumido = Awaited<ReturnType<typeof listarTodosPacotes>>[number];
