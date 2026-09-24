"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatarData, hojeISOemSaoPaulo } from "@/lib/datas";
import type { AgendamentoDoDia } from "@/lib/data/agenda";

const ABREV_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

function paraISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function construirSemanasDoMes(dataISO: string): { dataISO: string; noMes: boolean }[][] {
  const [ano, mes] = dataISO.split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);

  const cursor = new Date(primeiroDia);
  cursor.setDate(cursor.getDate() - primeiroDia.getDay());
  const fimGrade = new Date(ultimoDia);
  fimGrade.setDate(fimGrade.getDate() + (6 - ultimoDia.getDay()));

  const dias: { dataISO: string; noMes: boolean }[] = [];
  const c = new Date(cursor);
  while (c <= fimGrade) {
    dias.push({ dataISO: paraISO(c), noMes: c.getMonth() === mes - 1 });
    c.setDate(c.getDate() + 1);
  }

  const semanas: { dataISO: string; noMes: boolean }[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

export function CalendarioMes({
  dataISO,
  agendamentos,
}: {
  dataISO: string;
  agendamentos: AgendamentoDoDia[];
}) {
  const router = useRouter();
  const hojeISO = hojeISOemSaoPaulo();

  const semanas = useMemo(() => construirSemanasDoMes(dataISO), [dataISO]);

  const agendamentosPorDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoDoDia[]>();
    for (const agendamento of agendamentos) {
      if (agendamento.status === "cancelado") continue;
      const diaISO = formatarData(agendamento.inicio, "yyyy-MM-dd");
      const lista = mapa.get(diaISO) ?? [];
      lista.push(agendamento);
      mapa.set(diaISO, lista);
    }
    return mapa;
  }, [agendamentos]);

  return (
    <div className="flex flex-1 flex-col px-2 py-2">
      <div className="grid grid-cols-7">
        {ABREV_DIA.map((letra, indice) => (
          <div key={indice} className="py-1.5 text-center text-[11px] font-medium text-text-muted">
            {letra}
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {semanas.map((semana, indice) => (
          <div key={indice} className="grid flex-1 grid-cols-7 gap-1">
            {semana.map(({ dataISO: diaISO, noMes }) => {
              const doDia = agendamentosPorDia.get(diaISO) ?? [];
              const ehHoje = diaISO === hojeISO;
              const data = new Date(`${diaISO}T12:00:00`);

              return (
                <button
                  key={diaISO}
                  type="button"
                  onClick={() => router.push(`/agenda?visao=dia&data=${diaISO}`)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg py-1.5 active:bg-surface-alt",
                    !noMes && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[13px]",
                      ehHoje ? "bg-primary text-bg font-medium" : "text-text",
                    )}
                  >
                    {data.getDate()}
                  </span>
                  <div className="flex h-1.5 gap-0.5">
                    {doDia.slice(0, 3).map((agendamento) => (
                      <span
                        key={agendamento.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: agendamento.servicos?.cor ?? "#8B7CF6" }}
                      />
                    ))}
                    {doDia.length > 3 && (
                      <span className="text-[9px] leading-none text-text-muted">+{doDia.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
