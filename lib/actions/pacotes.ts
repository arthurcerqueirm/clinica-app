"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listarCreditosDisponiveis } from "@/lib/data/pacotes";
import { ratearDesconto, reaisParaCentavos } from "@/lib/dinheiro";
import type { Enums } from "@/types/database";

export async function buscarCreditosClienteAction(clienteId: string) {
  return listarCreditosDisponiveis(clienteId);
}

export type ItemPacoteInput = { servicoId: string; quantidade: number };

export type EntradaCriarPacote = {
  clienteId: string;
  nome: string;
  itens: ItemPacoteInput[];
  descontoTipo: Enums<"tipo_desconto">;
  descontoValor: number;
  validade?: string;
  observacoes?: string;
  salvarComoModelo?: string;
};

export async function criarPacoteAction(input: EntradaCriarPacote) {
  if (input.itens.length === 0) throw new Error("Adicione pelo menos um serviço.");
  if (!input.nome.trim()) throw new Error("Dê um nome para o pacote.");

  const supabase = await createClient();

  const { data: servicos, error: erroServicos } = await supabase
    .from("servicos")
    .select("id, nome, preco_centavos")
    .in(
      "id",
      input.itens.map((i) => i.servicoId),
    );

  if (erroServicos || !servicos) throw new Error("Não foi possível carregar os serviços.");

  const precoPorServico = new Map(servicos.map((s) => [s.id, s.preco_centavos]));

  const itensComValor = input.itens.map((item) => {
    const precoUnitario = precoPorServico.get(item.servicoId);
    if (precoUnitario === undefined) throw new Error("Serviço inválido.");
    return { ...item, precoUnitario, valorCentavos: precoUnitario * item.quantidade };
  });

  const valorBrutoCentavos = itensComValor.reduce((soma, item) => soma + item.valorCentavos, 0);

  const descontoTotalCentavos =
    input.descontoTipo === "percentual"
      ? Math.round(valorBrutoCentavos * (input.descontoValor / 100))
      : reaisParaCentavos(input.descontoValor);

  if (descontoTotalCentavos < 0 || descontoTotalCentavos > valorBrutoCentavos) {
    throw new Error("Desconto inválido: não pode ser maior que o valor do pacote.");
  }

  const valorFinalCentavos = valorBrutoCentavos - descontoTotalCentavos;

  const descontosPorItem = ratearDesconto(itensComValor, descontoTotalCentavos);

  const { data: pacote, error: erroPacote } = await supabase
    .from("pacotes")
    .insert({
      cliente_id: input.clienteId,
      nome: input.nome.trim(),
      valor_bruto_centavos: valorBrutoCentavos,
      desconto_tipo: input.descontoTipo,
      desconto_valor: input.descontoValor,
      valor_final_centavos: valorFinalCentavos,
      validade: input.validade || null,
      observacoes: input.observacoes?.trim() || null,
    })
    .select("id")
    .single();

  if (erroPacote || !pacote) throw new Error("Não foi possível criar o pacote.");

  const linhasItens = itensComValor.map((item, indice) => {
    const valorComDesconto = item.valorCentavos - descontosPorItem[indice];
    return {
      pacote_id: pacote.id,
      servico_id: item.servicoId,
      quantidade: item.quantidade,
      preco_unitario_centavos: item.precoUnitario,
      preco_unitario_com_desconto_centavos: Math.round(valorComDesconto / item.quantidade),
    };
  });

  const { error: erroItens } = await supabase.from("pacote_itens").insert(linhasItens);
  if (erroItens) throw new Error("Não foi possível salvar os itens do pacote.");

  const { error: erroCobranca } = await supabase.from("cobrancas").insert({
    cliente_id: input.clienteId,
    origem_tipo: "pacote",
    pacote_id: pacote.id,
    descricao: input.nome.trim(),
    valor_centavos: valorFinalCentavos,
  });
  if (erroCobranca) throw new Error("Pacote criado, mas não foi possível gerar a cobrança.");

  if (input.salvarComoModelo?.trim()) {
    await supabase.from("pacote_modelos").insert({
      nome: input.salvarComoModelo.trim(),
      desconto_tipo: input.descontoTipo,
      desconto_valor: input.descontoValor,
      itens: input.itens.map((i) => ({ servico_id: i.servicoId, quantidade: i.quantidade })),
    });
  }

  revalidatePath("/financeiro/pacotes");
  revalidatePath(`/clientes/${input.clienteId}`);
  revalidatePath("/financeiro");

  return { pacoteId: pacote.id };
}

export async function cancelarPacoteAction(pacoteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pacotes")
    .update({ status: "cancelado" })
    .eq("id", pacoteId);

  if (error) throw new Error("Não foi possível cancelar o pacote.");
  revalidatePath("/financeiro/pacotes");
}
