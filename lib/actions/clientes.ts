"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const telefoneVazioOuValido = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor))
  .refine((valor) => valor === null || /^\+[1-9][0-9]{7,14}$/.test(valor), {
    message: "Telefone precisa estar no formato +5511987654321",
  });

const campoOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor));

const ClienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  telefone: telefoneVazioOuValido,
  email: campoOpcional,
  data_nascimento: campoOpcional,
  restricoes_saude: campoOpcional,
  alergias: campoOpcional,
  preferencias: campoOpcional,
  observacoes: campoOpcional,
  como_conheceu: campoOpcional,
});

function dadosDoFormulario(formData: FormData) {
  return {
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    data_nascimento: formData.get("data_nascimento"),
    restricoes_saude: formData.get("restricoes_saude"),
    alergias: formData.get("alergias"),
    preferencias: formData.get("preferencias"),
    observacoes: formData.get("observacoes"),
    como_conheceu: formData.get("como_conheceu"),
  };
}

export type EstadoFormularioCliente = {
  erro?: string;
  camposComErro?: Record<string, string[]>;
};

export async function criarCliente(
  _estadoAnterior: EstadoFormularioCliente,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const resultado = ClienteSchema.safeParse(dadosDoFormulario(formData));

  if (!resultado.success) {
    return { camposComErro: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert(resultado.data)
    .select("id")
    .single();

  if (error) {
    return { erro: "Não foi possível salvar a cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function atualizarCliente(
  clienteId: string,
  _estadoAnterior: EstadoFormularioCliente,
  formData: FormData,
): Promise<EstadoFormularioCliente> {
  const resultado = ClienteSchema.safeParse(dadosDoFormulario(formData));

  if (!resultado.success) {
    return { camposComErro: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(resultado.data)
    .eq("id", clienteId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function criarClienteRapidoAction(nome: string) {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) throw new Error("Nome é obrigatório.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ nome: nomeLimpo })
    .select("id, nome, telefone")
    .single();

  if (error) throw new Error("Não foi possível cadastrar a cliente.");

  revalidatePath("/clientes");
  return data;
}

export async function arquivarClienteAction(clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ arquivado_em: new Date().toISOString() })
    .eq("id", clienteId);

  if (error) throw new Error("Não foi possível arquivar a cliente.");

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
}

export async function restaurarClienteAction(clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ arquivado_em: null })
    .eq("id", clienteId);

  if (error) throw new Error("Não foi possível restaurar a cliente.");

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
}

export async function excluirClientePermanentementeAction(clienteId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId);

  if (count && count > 0) {
    throw new Error("Só é possível excluir clientes sem nenhum atendimento registrado.");
  }

  const { error } = await supabase.from("clientes").delete().eq("id", clienteId);
  if (error) throw new Error("Não foi possível excluir a cliente.");

  revalidatePath("/clientes");
  redirect("/clientes");
}
