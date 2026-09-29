import { Suspense, ViewTransition } from "react";
import { Tela } from "@/components/ui/tela";
import { SeletorVisao } from "@/components/agenda/seletor-visao";
import { SeletorData } from "@/components/agenda/seletor-data";
import { AgendaSwipe } from "@/components/agenda/agenda-swipe";
import { GradeDia } from "@/components/agenda/grade-dia";
import { GradeSemana } from "@/components/agenda/grade-semana";
import { CalendarioMes } from "@/components/agenda/calendario-mes";
import { ListaProximos } from "@/components/agenda/lista-proximos";
import { GradeSkeleton } from "@/components/agenda/grade-skeleton";
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
    <Tela>
      <header className="sticky top-0 z-30 flex flex-col gap-1 bg-bg/85 pt-2.5 backdrop-blur-xl">
        <h1 className="px-4 text-[26px] font-bold tracking-tight text-text">Agenda</h1>
        <SeletorVisao visao={visao} dataISO={dataISO} />
        <SeletorData visao={visao} dataISO={dataISO} />
      </header>
      <AgendaSwipe visao={visao} dataISO={dataISO}>
        <ViewTransition
          key={`${visao}-${dataISO}`}
          enter={{ avancar: "avancar", voltar: "voltar", default: "tela-entra" }}
          exit={{ avancar: "avancar", voltar: "voltar", default: "tela-sai" }}
          default="none"
        >
          <div className="flex flex-1 flex-col">
            <Suspense fallback={<GradeSkeleton visao={visao} />}>
              <Conteudo visao={visao} dataISO={dataISO} />
            </Suspense>
          </div>
        </ViewTransition>
      </AgendaSwipe>
    </Tela>
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

  const listar = visao === "semana" ? listarAgendamentosDaSemana : listarAgendamentosDoDia;
  const [faixa, agendamentos] = await Promise.all([buscarFaixaGradeAgenda(), listar(dataISO)]);

  if (visao === "semana") {
    return <GradeSemana dataISO={dataISO} faixa={faixa} agendamentos={agendamentos} />;
  }

  return <GradeDia dataISO={dataISO} faixa={faixa} agendamentos={agendamentos} />;
}
