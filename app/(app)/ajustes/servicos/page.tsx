import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ServicosList } from "@/components/servicos/servicos-list";
import { listarServicos } from "@/lib/data/servicos";

export default async function ServicosPage() {
  const servicos = await listarServicos();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        titulo="Serviços"
        voltarPara="/ajustes"
        acao={
          <Link
            href="/ajustes/servicos/novo"
            aria-label="Novo serviço"
            className="no-select flex h-9 w-9 items-center justify-center rounded-full text-primary active:bg-surface-alt"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <ServicosList servicos={servicos} />
    </div>
  );
}
