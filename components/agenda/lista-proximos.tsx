import { CalendarClock } from "lucide-react";
import { AgendamentoCard } from "@/components/agenda/agendamento-card";
import { formatarData, hojeISOemSaoPaulo } from "@/lib/datas";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

function rotuloDoDia(dataISO: string, hojeISO: string): string {
  if (dataISO === hojeISO) return "Hoje";

  const amanha = new Date(`${hojeISO}T12:00:00`);
  amanha.setDate(amanha.getDate() + 1);
  if (dataISO === amanha.toISOString().slice(0, 10)) return "Amanhã";

  const rotulo = formatarData(`${dataISO}T12:00:00`, "EEEE, dd 'de' MMMM");
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

export function ListaProximos({ agendamentos }: { agendamentos: AgendamentoDoDia[] }) {
  if (agendamentos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <CalendarClock size={26} />
        </div>
        <h2 className="text-lg font-semibold text-text">Nada agendado por enquanto</h2>
        <p className="max-w-xs text-sm text-text-muted">
          Toque no botão + para marcar um atendimento.
        </p>
      </div>
    );
  }

  const hojeISO = hojeISOemSaoPaulo();
  const grupos: { dataISO: string; itens: AgendamentoDoDia[] }[] = [];

  for (const agendamento of agendamentos) {
    const diaISO = formatarData(agendamento.inicio, "yyyy-MM-dd");
    const ultimoGrupo = grupos[grupos.length - 1];
    if (ultimoGrupo?.dataISO === diaISO) ultimoGrupo.itens.push(agendamento);
    else grupos.push({ dataISO: diaISO, itens: [agendamento] });
  }

  return (
    <div className="flex-1 py-2">
      {grupos.map((grupo) => (
        <div key={grupo.dataISO}>
          <p className="px-4 pt-3 pb-1 text-[13px] font-semibold text-text-muted capitalize">
            {rotuloDoDia(grupo.dataISO, hojeISO)}
          </p>
          {grupo.itens.map((agendamento) => (
            <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
          ))}
        </div>
      ))}
    </div>
  );
}
