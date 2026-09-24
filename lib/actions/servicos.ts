"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reaisParaCentavos } from "@/lib/dinheiro";

const ServicoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  duracao_min: z.coerce.number().int().min(1, "Duração precisa ser maior que zero").max(480),
  preco_reais: z.coerce.number().min(0, "Preço não pode ser negativo"),
  cor: z.string().trim().min(1),
  descricao: z
    .string()
    .trim()
    .transform((valor) => (valor === "" ? null : valor)),
});

function dadosDoFormulario(formData: FormData) {
  return {
    nome: formData.get("nome"),
    duracao_min: formData.get("duracao_min"),
    preco_reais: formData.get("preco_reais"),
    cor: formData.get("cor"),
    descricao: formData.get("descricao"),
  };
}

export type EstadoFormularioServico = {
  erro?: string;
  camposComErro?: Record<string, string[]>;
};

export async function criarServico(
  _estadoAnterior: EstadoFormularioServico,
  formData: FormData,
): Promise<EstadoFormularioServico> {
  const resultado = ServicoSchema.safeParse(dadosDoFormulario(formData));
  if (!resultado.success) {
    return { camposComErro: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("servicos")
    .select("id", { count: "exact", head: true });

  const { nome, duracao_min, preco_reais, cor, descricao } = resultado.data;
  const { error } = await supabase.from("servicos").insert({
    nome,
    duracao_min,
    preco_centavos: reaisParaCentavos(preco_reais),
    cor,
    descricao,
    ordem: count ?? 0,
  });

  if (error) {
    return { erro: "Não foi possível salvar o serviço. Tente novamente." };
  }

  revalidatePath("/ajustes/servicos");
  redirect("/ajustes/servicos");
}

export async function atualizarServico(
  servicoId: string,
  _estadoAnterior: EstadoFormularioServico,
  formData: FormData,
): Promise<EstadoFormularioServico> {
  const resultado = ServicoSchema.safeParse(dadosDoFormulario(formData));
  if (!resultado.success) {
    return { camposComErro: resultado.error.flatten().fieldErrors };
  }

  const { nome, duracao_min, preco_reais, cor, descricao } = resultado.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("servicos")
    .update({
      nome,
      duracao_min,
      preco_centavos: reaisParaCentavos(preco_reais),
      cor,
      descricao,
    })
    .eq("id", servicoId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/ajustes/servicos");
  redirect("/ajustes/servicos");
}

export async function alternarAtivoServicoAction(servicoId: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("servicos").update({ ativo }).eq("id", servicoId);
  if (error) throw new Error("Não foi possível atualizar o serviço.");
  revalidatePath("/ajustes/servicos");
}

export async function moverServicoAction(servicoId: string, direcao: "cima" | "baixo") {
  const supabase = await createClient();
  const { data: servicos } = await supabase
    .from("servicos")
    .select("id, ordem")
    .order("ordem");

  if (!servicos) return;

  const indice = servicos.findIndex((s) => s.id === servicoId);
  const indiceAlvo = direcao === "cima" ? indice - 1 : indice + 1;
  if (indice === -1 || indiceAlvo < 0 || indiceAlvo >= servicos.length) return;

  const atual = servicos[indice];
  const alvo = servicos[indiceAlvo];

  await Promise.all([
    supabase.from("servicos").update({ ordem: alvo.ordem }).eq("id", atual.id),
    supabase.from("servicos").update({ ordem: atual.ordem }).eq("id", alvo.id),
  ]);

  revalidatePath("/ajustes/servicos");
}
