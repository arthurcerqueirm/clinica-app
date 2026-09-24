import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

// Sempre armazenar timestamptz (UTC) no banco; converter só na exibição.
// pg_cron roda em UTC — ver PLANO.md §8.6. Nunca comparar/formatar sem passar por aqui.
export const FUSO = "America/Sao_Paulo";

/** Horário "de parede" que a usuária digitou (ex: 14:30 em SP) → instante UTC para salvar. */
export function paraUTC(dataLocalISO: string): Date {
  return fromZonedTime(dataLocalISO, FUSO);
}

/** timestamptz (UTC) vindo do banco → Date ajustada para exibir no fuso de SP. */
export function paraSaoPaulo(dataUTC: Date | string): Date {
  return toZonedTime(dataUTC, FUSO);
}

export function formatarDataHora(
  dataUTC: Date | string,
  padrao = "dd/MM/yyyy 'às' HH:mm",
): string {
  return formatInTimeZone(dataUTC, FUSO, padrao, { locale: ptBR });
}

export function formatarData(dataUTC: Date | string, padrao = "dd/MM/yyyy"): string {
  return formatInTimeZone(dataUTC, FUSO, padrao, { locale: ptBR });
}

export function formatarHora(dataUTC: Date | string): string {
  return formatInTimeZone(dataUTC, FUSO, "HH:mm", { locale: ptBR });
}

/** "Hoje" de verdade em SP, não no fuso do servidor (que geralmente roda em UTC). */
export function hojeISOemSaoPaulo(): string {
  return formatInTimeZone(new Date(), FUSO, "yyyy-MM-dd");
}
