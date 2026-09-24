import { PageHeader } from "@/components/ui/page-header";
import { NovoAgendamentoWizard } from "@/components/agenda/novo-agendamento-wizard";
import { createClient } from "@/lib/supabase/server";
import { listarServicosAtivos } from "@/lib/data/servicos";
import { hojeISOemSaoPaulo } from "@/lib/datas";

export default async function NovoAgendamentoPage({
  searchParams,
}: PageProps<"/agenda/novo">) {
  const params = await searchParams;
  const clienteIdPreSelecionado =
    typeof params.cliente === "string" ? params.cliente : undefined;
  const dataParam = typeof params.data === "string" ? params.data : undefined;
  const dataInicial =
    dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : hojeISOemSaoPaulo();
  const horarioSugerido =
    typeof params.horario === "string" && /^\d{2}:\d{2}$/.test(params.horario)
      ? params.horario
      : undefined;

  const supabase = await createClient();
  const [{ data: clientes }, servicos, { data: clientePreSelecionado }] = await Promise.all([
    supabase.from("clientes").select("id, nome, telefone").is("arquivado_em", null).order("nome"),
    listarServicosAtivos(),
    clienteIdPreSelecionado
      ? supabase
          .from("clientes")
          .select("id, nome, telefone")
          .eq("id", clienteIdPreSelecionado)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Novo agendamento" voltarPara="/agenda" />
      <NovoAgendamentoWizard
        clientes={clientes ?? []}
        servicos={servicos}
        clientePreSelecionado={clientePreSelecionado}
        horarioSugerido={horarioSugerido}
        dataInicial={dataInicial}
      />
    </div>
  );
}
