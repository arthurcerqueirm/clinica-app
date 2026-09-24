"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reaisParaCentavos } from "@/lib/dinheiro";
import type { Enums } from "@/types/database";

const CampoOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor));

const DespesaSchemaBase = z.object({
  descricao: z.string().trim().min(1, "Descrição é obrigatória"),
  valor_reais: z.coerce.number().positive("Valor precisa ser maior que zero"),
  categoria_id: CampoOpcional,
});

const DespesaFixaSchema = DespesaSchemaBase.extend({
  tipo: z.literal("fixa"),
  dia_vencimento: z.coerce.number().int().min(1).max(31),
  recorrencia: z.enum(["mensal", "bimestral", "trimestral", "anual"]),
});

const METODOS_PAGAMENTO = [
  "pix",
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "transferencia",
  "outro",
] as const;

const DespesaOcasionalSchema = DespesaSchemaBase.extend({
  tipo: z.literal("ocasional"),
  data_despesa: z.string().min(1, "Data é obrigatória"),
  metodo: z.enum(METODOS_PAGAMENTO),
});

const DespesaSchema = z.discriminatedUnion("tipo", [
  DespesaFixaSchema,
  DespesaOcasionalSchema,
]);

export type EstadoFormularioDespesa = {
  erro?: string;
  camposComErro?: Record<string, string[]>;
};

export async function criarDespesaAction(
  _estadoAnterior: EstadoFormularioDespesa,
  formData: FormData,
): Promise<EstadoFormularioDespesa> {
  const bruto = {
    tipo: formData.get("tipo"),
    descricao: formData.get("descricao"),
    valor_reais: formData.get("valor_reais"),
    categoria_id: formData.get("categoria_id"),
    dia_vencimento: formData.get("dia_vencimento"),
    recorrencia: formData.get("recorrencia"),
    data_despesa: formData.get("data_despesa"),
    metodo: formData.get("metodo"),
  };

  const resultado = DespesaSchema.safeParse(bruto);
  if (!resultado.success) {
    return { camposComErro: resultado.error.flatten().fieldErrors };
  }

  const dados = resultado.data;
  const supabase = await createClient();
  const valorCentavos = reaisParaCentavos(dados.valor_reais);

  const { data: despesa, error } = await supabase
    .from("despesas")
    .insert(
      dados.tipo === "fixa"
        ? {
            descricao: dados.descricao,
            valor_centavos: valorCentavos,
            categoria_id: dados.categoria_id,
            tipo: "fixa",
            recorrencia: dados.recorrencia,
            dia_vencimento: dados.dia_vencimento,
          }
        : {
            descricao: dados.descricao,
            valor_centavos: valorCentavos,
            categoria_id: dados.categoria_id,
            tipo: "ocasional",
            recorrencia: "nenhuma",
            data_despesa: dados.data_despesa,
          },
    )
    .select("id")
    .single();

  if (error || !despesa) {
    return { erro: "Não foi possível salvar a despesa. Tente novamente." };
  }

  if (dados.tipo === "fixa") {
    await gerarOcorrenciaMesAtual(despesa.id, dados.dia_vencimento, valorCentavos);
  } else {
    // Despesas ocasionais já nascem pagas (normalmente são lançadas depois de
    // acontecerem) — a ocorrência é quem entra na soma de "saídas" do dashboard.
    const [ano, mes] = dados.data_despesa.split("-");
    await supabase.from("despesas_ocorrencias").insert({
      despesa_id: despesa.id,
      competencia: `${ano}-${mes}-01`,
      vencimento: dados.data_despesa,
      valor_centavos: valorCentavos,
      pago: true,
      pago_em: new Date(`${dados.data_despesa}T12:00:00`).toISOString(),
      metodo: dados.metodo,
    });
  }

  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro");
  redirect("/financeiro/despesas");
}

async function gerarOcorrencia(
  despesaId: string,
  competencia: string,
  vencimento: string,
  valorCentavos: number,
) {
  const supabase = await createClient();
  await supabase
    .from("despesas_ocorrencias")
    .insert({ despesa_id: despesaId, competencia, vencimento, valor_centavos: valorCentavos })
    .select()
    .maybeSingle();
}

async function gerarOcorrenciaMesAtual(despesaId: string, diaVencimento: number, valorCentavos: number) {
  const hoje = new Date();
  const competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
  const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const dia = Math.min(diaVencimento, ultimoDiaDoMes);
  const vencimento = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  await gerarOcorrencia(despesaId, competencia, vencimento, valorCentavos);
}

export async function gerarOcorrenciaMesAtualAction(despesaId: string) {
  const supabase = await createClient();
  const { data: despesa } = await supabase
    .from("despesas")
    .select("dia_vencimento, valor_centavos, tipo, ativa")
    .eq("id", despesaId)
    .maybeSingle();

  if (!despesa || despesa.tipo !== "fixa" || !despesa.ativa || !despesa.dia_vencimento) return;

  await gerarOcorrenciaMesAtual(despesaId, despesa.dia_vencimento, despesa.valor_centavos);
  revalidatePath("/financeiro/despesas");
}

export async function marcarOcorrenciaPagaAction(
  ocorrenciaId: string,
  metodo: Enums<"metodo_pagamento">,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("despesas_ocorrencias")
    .update({ pago: true, pago_em: new Date().toISOString(), metodo })
    .eq("id", ocorrenciaId);

  if (error) throw new Error("Não foi possível marcar como paga.");
  revalidatePath("/financeiro/despesas");
  revalidatePath("/financeiro");
}

export async function alternarAtivaDespesaAction(despesaId: string, ativa: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("despesas").update({ ativa }).eq("id", despesaId);
  if (error) throw new Error("Não foi possível atualizar a despesa.");
  revalidatePath("/financeiro/despesas");
}
