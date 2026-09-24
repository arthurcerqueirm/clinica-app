"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listarCobrancasComSaldo } from "@/lib/data/pagamentos";
import type { Enums } from "@/types/database";

export async function buscarCobrancasClienteAction(clienteId: string) {
  return listarCobrancasComSaldo(clienteId);
}

export async function registrarPagamentoAction(input: {
  cobrancaId: string;
  valorCentavos: number;
  metodo: Enums<"metodo_pagamento">;
  observacao?: string;
}) {
  if (input.valorCentavos <= 0) throw new Error("Valor precisa ser maior que zero.");

  const supabase = await createClient();
  const { error } = await supabase.from("pagamentos").insert({
    cobranca_id: input.cobrancaId,
    valor_centavos: input.valorCentavos,
    metodo: input.metodo,
    observacao: input.observacao?.trim() || null,
  });

  if (error) throw new Error("Não foi possível registrar o pagamento.");

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/inadimplentes");
  revalidatePath("/clientes");
}

export async function criarCobrancaAvulsaAction(input: {
  clienteId: string;
  descricao: string;
  valorCentavos: number;
  vencimento?: string;
}) {
  if (input.valorCentavos <= 0) throw new Error("Valor precisa ser maior que zero.");
  if (!input.descricao.trim()) throw new Error("Descrição é obrigatória.");

  const supabase = await createClient();
  const { error } = await supabase.from("cobrancas").insert({
    cliente_id: input.clienteId,
    origem_tipo: "avulso",
    descricao: input.descricao.trim(),
    valor_centavos: input.valorCentavos,
    vencimento: input.vencimento || null,
  });

  if (error) throw new Error("Não foi possível criar a cobrança.");

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/inadimplentes");
  revalidatePath("/clientes");
}
