import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { criarCliente } from "@/lib/actions/clientes";

export default function NovaClientePage() {
  return (
    <Tela>
      <PageHeader titulo="Nova cliente" voltarPara="/clientes" />
      <ClienteForm action={criarCliente} textoBotao="Cadastrar" />
    </Tela>
  );
}
