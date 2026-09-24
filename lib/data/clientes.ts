import { createClient } from "@/lib/supabase/server";
import { listarCobrancasComSaldo } from "@/lib/data/pagamentos";

export type ClienteComResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  restricoes_saude: string | null;
  alergias: string | null;
  preferencias: string | null;
  observacoes: string | null;
  como_conheceu: string | null;
  arquivado_em: string | null;
  saldoDevedor: number;
  temPacoteAtivo: boolean;
  ultimoAtendimento: string | null;
  aniversarianteHoje: boolean;
};

export async function listarClientesComResumo(): Promise<ClienteComResumo[]> {
  const supabase = await createClient();

  const [
    { data: clientes },
    { data: saldos },
    { data: pacotesAtivos },
    { data: atendimentos },
  ] = await Promise.all([
    supabase.from("clientes").select("*").is("arquivado_em", null).order("nome"),
    supabase.from("vw_saldo_cliente").select("cliente_id, saldo_devedor"),
    supabase.from("pacotes").select("cliente_id").eq("status", "ativo"),
    supabase
      .from("agendamentos")
      .select("cliente_id, inicio")
      .eq("status", "concluido")
      .order("inicio", { ascending: false }),
  ]);

  const saldoPorCliente = new Map(
    (saldos ?? []).map((s) => [s.cliente_id, s.saldo_devedor ?? 0]),
  );
  const temPacoteAtivo = new Set((pacotesAtivos ?? []).map((p) => p.cliente_id));

  const ultimoAtendimentoPorCliente = new Map<string, string>();
  for (const atendimento of atendimentos ?? []) {
    if (!ultimoAtendimentoPorCliente.has(atendimento.cliente_id)) {
      ultimoAtendimentoPorCliente.set(atendimento.cliente_id, atendimento.inicio);
    }
  }

  const hoje = new Date();

  return (clientes ?? []).map((cliente) => ({
    ...cliente,
    saldoDevedor: saldoPorCliente.get(cliente.id) ?? 0,
    temPacoteAtivo: temPacoteAtivo.has(cliente.id),
    ultimoAtendimento: ultimoAtendimentoPorCliente.get(cliente.id) ?? null,
    aniversarianteHoje: ehAniversarioHoje(cliente.data_nascimento, hoje),
  }));
}

function ehAniversarioHoje(dataNascimento: string | null, hoje: Date): boolean {
  if (!dataNascimento) return false;
  const partes = dataNascimento.split("-").map(Number);
  const mes = partes[1];
  const dia = partes[2];
  return mes === hoje.getMonth() + 1 && dia === hoje.getDate();
}

export async function buscarClientePorId(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function buscarFichaCliente(id: string) {
  const supabase = await createClient();

  const [{ data: cliente }, { data: saldo }, { data: agendamentos }, cobrancasAbertas, { data: pacotes }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
      supabase.from("vw_saldo_cliente").select("*").eq("cliente_id", id).maybeSingle(),
      supabase
        .from("agendamentos")
        .select("id, inicio, fim, status, valor_cobrado_centavos, notas_sessao, servicos(nome)")
        .eq("cliente_id", id)
        .order("inicio", { ascending: false }),
      listarCobrancasComSaldo(id),
      supabase
        .from("pacotes")
        .select(
          "id, nome, status, validade, valor_final_centavos, pacote_itens(id, quantidade, quantidade_usada, servicos(nome))",
        )
        .eq("cliente_id", id)
        .order("criado_em", { ascending: false }),
    ]);

  return {
    cliente,
    saldo,
    agendamentos: agendamentos ?? [],
    cobrancasAbertas,
    pacotes: pacotes ?? [],
  };
}

export type FichaCliente = Awaited<ReturnType<typeof buscarFichaCliente>>;
