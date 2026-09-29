import { Plus } from "lucide-react";
import { Tela } from "@/components/ui/tela";
import { PageHeader, AcaoHeader } from "@/components/ui/page-header";
import { ServicosList } from "@/components/servicos/servicos-list";
import { listarServicos } from "@/lib/data/servicos";

export default async function ServicosPage() {
  const servicos = await listarServicos();

  return (
    <Tela>
      <PageHeader
        titulo="Serviços"
        voltarPara="/ajustes"
        acao={
          <AcaoHeader href="/ajustes/servicos/novo" label="Novo serviço">
            <Plus size={21} />
          </AcaoHeader>
        }
      />
      <ServicosList servicos={servicos} />
    </Tela>
  );
}
