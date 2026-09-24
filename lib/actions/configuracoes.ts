"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoConfiguracaoCobranca = { erro?: string; salvo?: boolean };

export async function salvarConfiguracaoCobrancaAction(
  _estadoAnterior: EstadoConfiguracaoCobranca,
  formData: FormData,
): Promise<EstadoConfiguracaoCobranca> {
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const chavePix = String(formData.get("chave_pix") ?? "").trim();

  if (!mensagem) return { erro: "A mensagem não pode ficar vazia." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .upsert([
      { chave: "mensagem_cobranca", valor: { texto: mensagem } },
      { chave: "chave_pix", valor: { valor: chavePix } },
    ]);

  if (error) return { erro: "Não foi possível salvar as configurações." };

  revalidatePath("/ajustes/cobranca");
  return { salvo: true };
}

export type EstadoFaixaGradeAgenda = { erro?: string; salvo?: boolean };

export async function salvarFaixaGradeAgendaAction(
  _estadoAnterior: EstadoFaixaGradeAgenda,
  formData: FormData,
): Promise<EstadoFaixaGradeAgenda> {
  const inicio = String(formData.get("inicio") ?? "");
  const fim = String(formData.get("fim") ?? "");
  const formatoValido = /^\d{2}:\d{2}$/;

  if (!formatoValido.test(inicio) || !formatoValido.test(fim)) {
    return { erro: "Horários inválidos." };
  }
  if (fim <= inicio) return { erro: "O fim precisa ser depois do início." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .upsert({ chave: "agenda_grade", valor: { inicio, fim } });

  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath("/ajustes/agenda");
  revalidatePath("/agenda");
  return { salvo: true };
}

export async function salvarPrefNotificacaoAction(tipo: string, ativo: boolean) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "notificacoes_prefs")
    .maybeSingle();

  const prefsAtuais = (data?.valor as Record<string, { ativo: boolean }> | null) ?? {};
  const novasPrefs = { ...prefsAtuais, [tipo]: { ativo } };

  const { error } = await supabase
    .from("configuracoes")
    .upsert({ chave: "notificacoes_prefs", valor: novasPrefs });

  if (error) throw new Error("Não foi possível salvar a preferência.");
  revalidatePath("/ajustes/notificacoes");
}
