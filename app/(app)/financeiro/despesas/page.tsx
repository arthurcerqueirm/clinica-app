import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="flex flex-1 flex-col">
      <PageHeader
        titulo="Despesas"
        voltarPara="/financeiro"
        acao={
          <Link
            href="/financeiro/despesas/nova"
            aria-label="Nova despesa"
            className="no-select flex h-9 w-9 items-center justify-center rounded-full text-primary active:bg-surface-alt"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <DespesasList
        despesas={despesas}
        ocorrenciasPendentes={ocorrenciasPendentes}
        despesaIdsComOcorrenciaEsteMes={[...idsComOcorrencia]}
      />
    </div>
  );
}
