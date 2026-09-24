"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { BlocoAgendamento } from "@/components/agenda/bloco-agendamento";
import {
  ALTURA_HORA_PX,
  GRANULARIDADE_TAP_MIN,
  horasDaFaixa,
  paraMinutos,
  rotuloMinutos,
  slotOcupado,
  slotsDaFaixa,
  type Ocupacao,
} from "@/lib/agenda-grade";
import { cn } from "@/lib/cn";
import { formatarData, formatarHora, hojeISOemSaoPaulo } from "@/lib/datas";
import type { AgendamentoDoDia } from "@/lib/data/agenda";
import type { FaixaGradeAgenda } from "@/lib/data/configuracoes";

const ABREV_DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function diasDaSemana(dataISO: string): string[] {
  const inicio = new Date(`${dataISO}T12:00:00`);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setDate(dia.getDate() + i);
    return dia.toISOString().slice(0, 10);
  });
}

export function GradeSemana({
  dataISO,
  faixa,
  agendamentos,
}: {
  dataISO: string;
  faixa: FaixaGradeAgenda;
  agendamentos: AgendamentoDoDia[];
}) {
  const router = useRouter();
  const gradeRef = useRef<HTMLDivElement>(null);

  const inicioMin = paraMinutos(faixa.inicio);
  const fimMin = paraMinutos(faixa.fim);
  const horas = horasDaFaixa(faixa.inicio, faixa.fim);
  const slots = slotsDaFaixa(faixa.inicio, faixa.fim);
  const pxPorMin = ALTURA_HORA_PX / 60;
  const hojeISO = hojeISOemSaoPaulo();

  const dias = useMemo(() => diasDaSemana(dataISO), [dataISO]);

  const agendamentosPorDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoDoDia[]>();
    for (const agendamento of agendamentos) {
      const diaISO = formatarData(agendamento.inicio, "yyyy-MM-dd");
      const lista = mapa.get(diaISO) ?? [];
      lista.push(agendamento);
      mapa.set(diaISO, lista);
    }
    return mapa;
  }, [agendamentos]);

  const ocupacoesPorDia = useMemo(() => {
    const mapa = new Map<string, Ocupacao[]>();
    for (const [diaISO, lista] of agendamentosPorDia) {
      mapa.set(
        diaISO,
        lista
          .filter((a) => a.status !== "cancelado")
          .map((a) => ({
            inicio: paraMinutos(formatarHora(a.inicio)),
            fim: paraMinutos(formatarHora(a.fim)),
          })),
      );
    }
    return mapa;
  }, [agendamentosPorDia]);

  useEffect(() => {
    const grade = gradeRef.current;
    if (!grade) return;
    const ehSemanaAtual = dias.includes(hojeISO);
    const minutoAlvo = ehSemanaAtual ? paraMinutos(formatarHora(new Date())) : inicioMin + 60;
    const offset = Math.max(0, (minutoAlvo - inicioMin) * pxPorMin - 100);
    const topoDaGrade = grade.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: topoDaGrade + offset });
  }, [dias, hojeISO, inicioMin, pxPorMin]);

  function criarEm(diaISO: string, minutos: number) {
    router.push(`/agenda/novo?data=${diaISO}&horario=${rotuloMinutos(minutos)}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex border-b border-border pl-11">
        {dias.map((diaISO) => {
          const data = new Date(`${diaISO}T12:00:00`);
          const ehHoje = diaISO === hojeISO;
          return (
            <button
              key={diaISO}
              type="button"
              onClick={() => router.push(`/agenda?visao=dia&data=${diaISO}`)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-center"
            >
              <span className="text-[10px] font-medium text-text-muted">
                {ABREV_DIA[data.getDay()]}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium",
                  ehHoje ? "bg-primary text-bg" : "text-text",
                )}
              >
                {data.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={gradeRef} className="flex flex-1">
        <div className="relative w-11 shrink-0" style={{ height: horas.length * ALTURA_HORA_PX }}>
          {horas.map((minutos) => (
            <span
              key={minutos}
              style={{ top: (minutos - inicioMin) * pxPorMin }}
              className="absolute left-1 text-[10px] text-text-muted"
            >
              {rotuloMinutos(minutos)}
            </span>
          ))}
        </div>

        {dias.map((diaISO) => {
          const ocupacoes = ocupacoesPorDia.get(diaISO) ?? [];
          return (
            <div
              key={diaISO}
              className="relative flex-1 border-l border-border"
              style={{ height: horas.length * ALTURA_HORA_PX }}
            >
              {horas.map((minutos) => (
                <div
                  key={minutos}
                  style={{ top: (minutos - inicioMin) * pxPorMin, height: ALTURA_HORA_PX }}
                  className="pointer-events-none absolute inset-x-0 border-t border-border"
                />
              ))}

              {slots.map((minutos) => {
                const ocupado = slotOcupado(minutos, GRANULARIDADE_TAP_MIN, ocupacoes);
                return (
                  <button
                    key={minutos}
                    type="button"
                    disabled={ocupado}
                    onClick={() => criarEm(diaISO, minutos)}
                    style={{
                      top: (minutos - inicioMin) * pxPorMin,
                      height: GRANULARIDADE_TAP_MIN * pxPorMin,
                    }}
                    className={cn("absolute inset-x-0", !ocupado && "active:bg-surface-alt")}
                  />
                );
              })}

              {(agendamentosPorDia.get(diaISO) ?? []).map((agendamento) => {
                const inicioAgMin = paraMinutos(formatarHora(agendamento.inicio));
                const fimAgMin = paraMinutos(formatarHora(agendamento.fim));
                const topo = Math.max(0, (inicioAgMin - inicioMin) * pxPorMin);
                const altura = Math.max(
                  18,
                  (Math.min(fimAgMin, fimMin) - Math.max(inicioAgMin, inicioMin)) * pxPorMin,
                );
                return (
                  <BlocoAgendamento
                    key={agendamento.id}
                    agendamento={agendamento}
                    top={topo}
                    altura={altura}
                    compacto
                    className="inset-x-0.5"
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
