import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { buscarClientePorId } from "@/lib/data/clientes";
import { atualizarCliente } from "@/lib/actions/clientes";

export default async function EditarClientePage({
  params,
}: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const cliente = await buscarClientePorId(id);

  if (!cliente) notFound();

  const acao = atualizarCliente.bind(null, id);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Editar cliente" voltarPara={`/clientes/${id}`} />
      <ClienteForm action={acao} cliente={cliente} textoBotao="Salvar alterações" />
    </div>
  );
}
