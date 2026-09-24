import { SeletorVisao } from "@/components/agenda/seletor-visao";
import { SeletorData } from "@/components/agenda/seletor-data";
import { AgendaSwipe } from "@/components/agenda/agenda-swipe";
import { GradeDia } from "@/components/agenda/grade-dia";
import { GradeSemana } from "@/components/agenda/grade-semana";
import { CalendarioMes } from "@/components/agenda/calendario-mes";
import { ListaProximos } from "@/components/agenda/lista-proximos";
import {
  listarAgendamentosDoDia,
  listarAgendamentosDaSemana,
  listarAgendamentosDoMes,
  listarProximosAgendamentos,
} from "@/lib/data/agenda";
import { buscarFaixaGradeAgenda } from "@/lib/data/configuracoes";
import { hojeISOemSaoPaulo } from "@/lib/datas";
import { VISOES_AGENDA, type VisaoAgenda } from "@/lib/agenda-grade";

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const params = await searchParams;

  const visaoParam = typeof params.visao === "string" ? params.visao : undefined;
  const visao: VisaoAgenda = VISOES_AGENDA.includes(visaoParam as VisaoAgenda)
    ? (visaoParam as VisaoAgenda)
    : "dia";

  const dataParam = typeof params.data === "string" ? params.data : undefined;
  const dataISO = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : hojeISOemSaoPaulo();

  return (
    <div className="flex flex-1 flex-col">
      <SeletorVisao visao={visao} dataISO={dataISO} />
      <SeletorData visao={visao} dataISO={dataISO} />
      <AgendaSwipe visao={visao} dataISO={dataISO}>
        <Conteudo visao={visao} dataISO={dataISO} />
      </AgendaSwipe>
    </div>
  );
}

async function Conteudo({ visao, dataISO }: { visao: VisaoAgenda; dataISO: string }) {
  if (visao === "lista") {
    const agendamentos = await listarProximosAgendamentos();
    return <ListaProximos agendamentos={agendamentos} />;
  }

  if (visao === "mes") {
    const agendamentos = await listarAgendamentosDoMes(dataISO);
    return <CalendarioMes dataISO={dataISO} agendamentos={agendamentos} />;
  }

  const faixa = await buscarFaixaGradeAgenda();

  if (visao === "semana") {
    const agendamentos = await listarAgendamentosDaSemana(dataISO);
    return <GradeSemana dataISO={dataISO} faixa={faixa} agendamentos={agendamentos} />;
  }

  const agendamentos = await listarAgendamentosDoDia(dataISO);
  return <GradeDia dataISO={dataISO} faixa={faixa} agendamentos={agendamentos} />;
}
