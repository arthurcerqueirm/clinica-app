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
import { formatarHora, hojeISOemSaoPaulo } from "@/lib/datas";
import type { AgendamentoDoDia } from "@/lib/data/agenda";
import type { FaixaGradeAgenda } from "@/lib/data/configuracoes";

export function GradeDia({
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

  const ocupacoes: Ocupacao[] = useMemo(
    () =>
      agendamentos
        .filter((a) => a.status !== "cancelado")
        .map((a) => ({
          inicio: paraMinutos(formatarHora(a.inicio)),
          fim: paraMinutos(formatarHora(a.fim)),
        })),
    [agendamentos],
  );

  useEffect(() => {
    const grade = gradeRef.current;
    if (!grade) return;
    const ehHoje = dataISO === hojeISOemSaoPaulo();
    const minutoAlvo = ehHoje ? paraMinutos(formatarHora(new Date())) : inicioMin + 60;
    const offset = Math.max(0, (minutoAlvo - inicioMin) * pxPorMin - 100);
    const topoDaGrade = grade.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: topoDaGrade + offset });
  }, [dataISO, inicioMin, pxPorMin]);

  function criarEm(minutos: number) {
    router.push(`/agenda/novo?data=${dataISO}&horario=${rotuloMinutos(minutos)}`);
  }

  return (
    <div className="flex-1">
      <div ref={gradeRef} className="relative" style={{ height: horas.length * ALTURA_HORA_PX }}>
        {horas.map((minutos) => (
          <div
            key={minutos}
            style={{ top: (minutos - inicioMin) * pxPorMin, height: ALTURA_HORA_PX }}
            className="pointer-events-none absolute inset-x-0 border-t border-border"
          >
            <span className="absolute top-1 left-2 w-12 text-[11px] text-text-muted">
              {rotuloMinutos(minutos)}
            </span>
          </div>
        ))}

        {slots.map((minutos) => {
          const ocupado = slotOcupado(minutos, GRANULARIDADE_TAP_MIN, ocupacoes);
          return (
            <button
              key={minutos}
              type="button"
              disabled={ocupado}
              onClick={() => criarEm(minutos)}
              style={{ top: (minutos - inicioMin) * pxPorMin, height: GRANULARIDADE_TAP_MIN * pxPorMin }}
              className={cn(
                "absolute inset-x-0 pl-14 text-left",
                !ocupado && "active:bg-surface-alt",
              )}
            />
          );
        })}

        {agendamentos.map((agendamento) => {
          const inicioAgMin = paraMinutos(formatarHora(agendamento.inicio));
          const fimAgMin = paraMinutos(formatarHora(agendamento.fim));
          const topo = Math.max(0, (inicioAgMin - inicioMin) * pxPorMin);
          const altura = Math.max(
            28,
            (Math.min(fimAgMin, fimMin) - Math.max(inicioAgMin, inicioMin)) * pxPorMin,
          );
          return (
            <BlocoAgendamento
              key={agendamento.id}
              agendamento={agendamento}
              top={topo}
              altura={altura}
              className="left-14 right-2"
            />
          );
        })}
      </div>
    </div>
  );
}
