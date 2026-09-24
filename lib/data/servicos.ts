import { createClient } from "@/lib/supabase/server";

export async function listarServicos() {
  const supabase = await createClient();
  const { data } = await supabase.from("servicos").select("*").order("ordem");
  return data ?? [];
}

export async function listarServicosAtivos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("servicos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");
  return data ?? [];
}

export async function buscarServicoPorId(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("servicos").select("*").eq("id", id).maybeSingle();
  return data;
}
