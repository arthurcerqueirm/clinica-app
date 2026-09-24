import { createClient } from "@/lib/supabase/server";

export async function listarCobrancasComSaldo(clienteId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cobrancas")
    .select("id, descricao, valor_centavos, vencimento, status, pagamentos(valor_centavos)")
    .eq("cliente_id", clienteId)
    .in("status", ["aberta", "parcial"])
    .order("vencimento");

  return (data ?? []).map(({ pagamentos, ...cobranca }) => {
    const totalPago = pagamentos.reduce((soma, p) => soma + p.valor_centavos, 0);
    return { ...cobranca, restanteCentavos: cobranca.valor_centavos - totalPago };
  });
}

export type CobrancaComSaldo = Awaited<ReturnType<typeof listarCobrancasComSaldo>>[number];
