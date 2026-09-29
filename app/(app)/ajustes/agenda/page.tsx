import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { FaixaGradeAgendaForm } from "@/components/ajustes/faixa-grade-agenda-form";
import { buscarFaixaGradeAgenda } from "@/lib/data/configuracoes";

export default async function ConfiguracaoAgendaPage() {
  const faixa = await buscarFaixaGradeAgenda();

  return (
    <Tela>
      <PageHeader titulo="Agenda" voltarPara="/ajustes" />
      <FaixaGradeAgendaForm faixa={faixa} />
    </Tela>
  );
}
