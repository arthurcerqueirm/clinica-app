import { UserPlus } from "lucide-react";
import { Tela } from "@/components/ui/tela";
import { PageHeader, AcaoHeader } from "@/components/ui/page-header";
import { ClientesList } from "@/components/clientes/clientes-list";
import { listarClientesComResumo } from "@/lib/data/clientes";

export default async function ClientesPage() {
  const clientes = await listarClientesComResumo();

  return (
    <Tela>
      <PageHeader
        titulo="Clientes"
        acao={
          <AcaoHeader href="/clientes/novo" label="Nova cliente">
            <UserPlus size={19} />
          </AcaoHeader>
        }
      />
      <ClientesList clientes={clientes} />
    </Tela>
  );
}
