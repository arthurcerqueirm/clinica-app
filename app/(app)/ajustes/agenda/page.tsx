import { PageHeader } from "@/components/ui/page-header";
import { FaixaGradeAgendaForm } from "@/components/ajustes/faixa-grade-agenda-form";
import { buscarFaixaGradeAgenda } from "@/lib/data/configuracoes";

export default async function ConfiguracaoAgendaPage() {
  const faixa = await buscarFaixaGradeAgenda();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Agenda" voltarPara="/ajustes" />
      <FaixaGradeAgendaForm faixa={faixa} />
    </div>
  );
}
