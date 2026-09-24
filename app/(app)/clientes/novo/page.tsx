import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { criarCliente } from "@/lib/actions/clientes";

export default function NovaClientePage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Nova cliente" voltarPara="/clientes" />
      <ClienteForm action={criarCliente} textoBotao="Cadastrar" />
    </div>
  );
}
