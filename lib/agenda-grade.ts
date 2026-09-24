export type VisaoAgenda = "dia" | "semana" | "mes" | "lista";
export const VISOES_AGENDA: VisaoAgenda[] = ["dia", "semana", "mes", "lista"];

export const ALTURA_HORA_PX = 64;

// Granularidade dos toques pra criar agendamento (diferente da granularidade
// de 15min usada em lib/data/agenda.ts pro cálculo real de horários livres,
// que continua sendo a verificação que vale de verdade — isso aqui é só pra
// já chegar no assistente com um horário sensato pré-marcado).
export const GRANULARIDADE_TAP_MIN = 30;

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function rotuloMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function horasDaFaixa(inicio: string, fim: string): number[] {
  const inicioMin = paraMinutos(inicio);
  const fimMin = paraMinutos(fim);
  const horas: number[] = [];
  for (let m = inicioMin; m < fimMin; m += 60) horas.push(m);
  return horas;
}

export function slotsDaFaixa(inicio: string, fim: string, passoMin = GRANULARIDADE_TAP_MIN): number[] {
  const inicioMin = paraMinutos(inicio);
  const fimMin = paraMinutos(fim);
  const slots: number[] = [];
  for (let m = inicioMin; m < fimMin; m += passoMin) slots.push(m);
  return slots;
}

export type Ocupacao = { inicio: number; fim: number };

export function slotOcupado(
  inicioSlotMin: number,
  passoMin: number,
  ocupacoes: Ocupacao[],
): boolean {
  const fimSlotMin = inicioSlotMin + passoMin;
  return ocupacoes.some((o) => inicioSlotMin < o.fim && fimSlotMin > o.inicio);
}

export function avancarData(dataISO: string, visao: VisaoAgenda, direcao: 1 | -1): string {
  const data = new Date(`${dataISO}T12:00:00`);
  if (visao === "semana") data.setDate(data.getDate() + direcao * 7);
  else if (visao === "mes") data.setMonth(data.getMonth() + direcao);
  else data.setDate(data.getDate() + direcao);
  return data.toISOString().slice(0, 10);
}
