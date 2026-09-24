import { PageHeader } from "@/components/ui/page-header";
import { ConstrutorPacote } from "@/components/pacotes/construtor-pacote";
import { createClient } from "@/lib/supabase/server";
import { listarServicosAtivos } from "@/lib/data/servicos";
import { listarModelosPacote } from "@/lib/data/pacotes";

export default async function NovoPacotePage({
  searchParams,
}: PageProps<"/financeiro/pacotes/novo">) {
  const params = await searchParams;
  const clienteIdPreSelecionado =
    typeof params.cliente === "string" ? params.cliente : undefined;

  const supabase = await createClient();
  const [{ data: clientes }, servicos, modelos, { data: clientePreSelecionado }] =
    await Promise.all([
      supabase.from("clientes").select("id, nome").is("arquivado_em", null).order("nome"),
      listarServicosAtivos(),
      listarModelosPacote(),
      clienteIdPreSelecionado
        ? supabase
            .from("clientes")
            .select("id, nome")
            .eq("id", clienteIdPreSelecionado)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        titulo="Novo pacote"
        voltarPara={clientePreSelecionado ? `/clientes/${clientePreSelecionado.id}` : "/financeiro/pacotes"}
      />
      <ConstrutorPacote
        clientes={clientes ?? []}
        servicos={servicos}
        modelos={modelos}
        clientePreSelecionado={clientePreSelecionado}
      />
    </div>
  );
}
