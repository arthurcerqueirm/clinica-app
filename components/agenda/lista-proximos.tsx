import { CalendarClock } from "lucide-react";
import { AgendamentoCard } from "@/components/agenda/agendamento-card";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
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
      <PlaceholderScreen
        icone={CalendarClock}
        titulo="Nada agendado por enquanto"
        descricao="Toque no botão + para marcar um atendimento."
      />
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

  let indice = 0;

  return (
    <div className="flex-1 py-2">
      {grupos.map((grupo) => (
        <div key={grupo.dataISO}>
          <p
            className="surgir px-5 pt-4 pb-1 text-[13px] font-semibold text-text-muted capitalize"
            style={{ "--i": indice++ } as React.CSSProperties}
          >
            {rotuloDoDia(grupo.dataISO, hojeISO)}
          </p>
          {grupo.itens.map((agendamento) => (
            <div
              key={agendamento.id}
              className="surgir"
              style={{ "--i": indice++ } as React.CSSProperties}
            >
              <AgendamentoCard agendamento={agendamento} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
