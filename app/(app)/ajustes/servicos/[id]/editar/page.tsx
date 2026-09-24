import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ServicoForm } from "@/components/servicos/servico-form";
import { buscarServicoPorId } from "@/lib/data/servicos";
import { atualizarServico } from "@/lib/actions/servicos";

export default async function EditarServicoPage({
  params,
}: PageProps<"/ajustes/servicos/[id]/editar">) {
  const { id } = await params;
  const servico = await buscarServicoPorId(id);

  if (!servico) notFound();

  const acao = atualizarServico.bind(null, id);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Editar serviço" voltarPara="/ajustes/servicos" />
      <ServicoForm action={acao} servico={servico} textoBotao="Salvar alterações" />
    </div>
  );
}
