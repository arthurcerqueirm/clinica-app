"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calcularSlotsLivres } from "@/lib/data/agenda";
import type { Enums } from "@/types/database";

export async function buscarSlotsLivresAction(dataISO: string, duracaoMin: number) {
  return calcularSlotsLivres(dataISO, duracaoMin);
}

export async function criarAgendamento(input: {
  clienteId: string;
  servicoId: string;
  inicioISO: string;
  pacoteItemId?: string | null;
  observacoes?: string;
}) {
  const supabase = await createClient();

  const { data: servico } = await supabase
    .from("servicos")
    .select("preco_centavos, duracao_min")
    .eq("id", input.servicoId)
    .maybeSingle();

  if (!servico) throw new Error("Serviço não encontrado.");

  const inicio = new Date(input.inicioISO);
  const fim = new Date(inicio.getTime() + servico.duracao_min * 60_000);

  const { error } = await supabase.from("agendamentos").insert({
    cliente_id: input.clienteId,
    servico_id: input.servicoId,
    pacote_item_id: input.pacoteItemId ?? null,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    preco_centavos: servico.preco_centavos,
    observacoes: input.observacoes?.trim() || null,
  });

  if (error) {
    if (error.code === "23P01") {
      throw new Error("Esse horário acabou de ser ocupado por outro agendamento.");
    }
    throw new Error("Não foi possível criar o agendamento.");
  }

  revalidatePath("/agenda");
}

type StatusAgendamento = Enums<"status_agendamento">;

export async function mudarStatusAgendamentoAction(
  agendamentoId: string,
  status: StatusAgendamento,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", agendamentoId);

  if (error) throw new Error("Não foi possível atualizar o agendamento.");
  revalidatePath("/agenda");
}
