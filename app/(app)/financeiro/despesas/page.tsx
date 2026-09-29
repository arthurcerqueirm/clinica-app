import { Plus } from "lucide-react";
import { Tela } from "@/components/ui/tela";
import { PageHeader, AcaoHeader } from "@/components/ui/page-header";
import { DespesasList } from "@/components/financeiro/despesas-list";
import {
  listarDespesas,
  listarOcorrenciasPendentes,
  listarDespesaIdsComOcorrenciaEsteMes,
} from "@/lib/data/despesas";

export default async function DespesasPage() {
  const [despesas, ocorrenciasPendentes, idsComOcorrencia] = await Promise.all([
    listarDespesas(),
    listarOcorrenciasPendentes(),
    listarDespesaIdsComOcorrenciaEsteMes(),
  ]);

  return (
    <Tela>
      <PageHeader
        titulo="Despesas"
        voltarPara="/financeiro"
        acao={
          <AcaoHeader href="/financeiro/despesas/nova" label="Nova despesa">
            <Plus size={21} />
          </AcaoHeader>
        }
      />
      <DespesasList
        despesas={despesas}
        ocorrenciasPendentes={ocorrenciasPendentes}
        despesaIdsComOcorrenciaEsteMes={[...idsComOcorrencia]}
      />
    </Tela>
  );
}
