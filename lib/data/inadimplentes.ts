import { createClient } from "@/lib/supabase/server";

export async function listarInadimplentes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vw_saldo_cliente")
    .select("*")
    .gt("saldo_devedor", 0)
    .order("vencimento_mais_antigo");
  return data ?? [];
}
