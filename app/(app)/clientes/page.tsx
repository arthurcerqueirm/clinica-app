import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ClientesList } from "@/components/clientes/clientes-list";
import { listarClientesComResumo } from "@/lib/data/clientes";

export default async function ClientesPage() {
  const clientes = await listarClientesComResumo();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        titulo="Clientes"
        acao={
          <Link
            href="/clientes/novo"
            aria-label="Nova cliente"
            className="no-select flex h-9 w-9 items-center justify-center rounded-full text-primary active:bg-surface-alt"
          >
            <UserPlus size={22} />
          </Link>
        }
      />
      <ClientesList clientes={clientes} />
    </div>
  );
}
