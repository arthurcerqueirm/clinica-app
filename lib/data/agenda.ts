import { createClient } from "@/lib/supabase/server";
import { paraUTC } from "@/lib/datas";

function limitesDoDiaUTC(dataISO: string) {
  return {
    inicioDia: paraUTC(`${dataISO}T00:00:00`).toISOString(),
    fimDia: paraUTC(`${dataISO}T23:59:59.999`).toISOString(),
  };
}

const COLUNAS_AGENDAMENTO =
  "id, inicio, fim, status, observacoes, valor_cobrado_centavos, cliente_id, servico_id, clientes(nome, telefone), servicos(nome, cor)";

async function buscarAgendamentosEntre(inicioUTC: string, fimUTC: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agendamentos")
    .select(COLUNAS_AGENDAMENTO)
    .lt("inicio", fimUTC)
    .gt("fim", inicioUTC)
    .order("inicio");

  return data ?? [];
}

export type AgendamentoDoDia = Awaited<ReturnType<typeof buscarAgendamentosEntre>>[number];

export async function listarAgendamentosDoDia(dataISO: string) {
  const { inicioDia, fimDia } = limitesDoDiaUTC(dataISO);
  return buscarAgendamentosEntre(inicioDia, fimDia);
}

/** Domingo da semana que contém `dataISO`, em "yyyy-MM-dd". */
function inicioDaSemanaISO(dataISO: string): string {
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() - data.getDay());
  return data.toISOString().slice(0, 10);
}

export async function listarAgendamentosDaSemana(dataISO: string) {
  const inicioSemanaISO = inicioDaSemanaISO(dataISO);
  const fimSemana = new Date(`${inicioSemanaISO}T12:00:00`);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const { inicioDia: inicioUTC } = limitesDoDiaUTC(inicioSemanaISO);
  const { fimDia: fimUTC } = limitesDoDiaUTC(fimSemana.toISOString().slice(0, 10));

  return buscarAgendamentosEntre(inicioUTC, fimUTC);
}

export async function listarAgendamentosDoMes(dataISO: string) {
  const [ano, mes] = dataISO.split("-").map(Number);
  const inicioMesISO = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fimMesISO = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

  const { inicioDia: inicioUTC } = limitesDoDiaUTC(inicioMesISO);
  const { fimDia: fimUTC } = limitesDoDiaUTC(fimMesISO);

  return buscarAgendamentosEntre(inicioUTC, fimUTC);
}

export async function listarProximosAgendamentos(diasAFrente = 60) {
  const supabase = await createClient();
  const agora = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + diasAFrente);

  const { data } = await supabase
    .from("agendamentos")
    .select(COLUNAS_AGENDAMENTO)
    .gte("fim", agora.toISOString())
    .lt("inicio", limite.toISOString())
    .neq("status", "cancelado")
    .order("inicio")
    .limit(200);

  return data ?? [];
}

const GRANULARIDADE_MIN = 15;

export async function calcularSlotsLivres(
  dataISO: string,
  duracaoMin: number,
): Promise<string[]> {
  const supabase = await createClient();
  const diaSemana = new Date(`${dataISO}T12:00:00`).getDay();
  const { inicioDia, fimDia } = limitesDoDiaUTC(dataISO);

  const [{ data: horarios }, { data: ocupadosAgendamentos }, { data: ocupadosBloqueios }] =
    await Promise.all([
      supabase
        .from("horarios_atendimento")
        .select("hora_inicio, hora_fim")
        .eq("dia_semana", diaSemana)
        .eq("ativo", true),
      supabase
        .from("agendamentos")
        .select("inicio, fim")
        .lt("inicio", fimDia)
        .gt("fim", inicioDia)
        .in("status", ["agendado", "confirmado", "concluido"]),
      supabase.from("bloqueios").select("inicio, fim").lt("inicio", fimDia).gt("fim", inicioDia),
    ]);

  const ocupacoes = [...(ocupadosAgendamentos ?? []), ...(ocupadosBloqueios ?? [])].map((o) => ({
    inicio: new Date(o.inicio).getTime(),
    fim: new Date(o.fim).getTime(),
  }));

  const agora = Date.now();
  const slots: string[] = [];

  for (const horario of horarios ?? []) {
    const [horaIni, minIni] = horario.hora_inicio.split(":").map(Number);
    const [horaFim, minFim] = horario.hora_fim.split(":").map(Number);

    const fimJanelaMin = horaFim * 60 + minFim;
    let cursorMin = horaIni * 60 + minIni;

    while (cursorMin + duracaoMin <= fimJanelaMin) {
      const hh = String(Math.floor(cursorMin / 60)).padStart(2, "0");
      const mm = String(cursorMin % 60).padStart(2, "0");

      const inicioSlot = paraUTC(`${dataISO}T${hh}:${mm}:00`).getTime();
      const fimSlot = inicioSlot + duracaoMin * 60_000;

      const conflita = ocupacoes.some((o) => inicioSlot < o.fim && fimSlot > o.inicio);

      if (!conflita && fimSlot > agora) {
        slots.push(`${hh}:${mm}`);
      }

      cursorMin += GRANULARIDADE_MIN;
    }
  }

  return [...new Set(slots)].sort();
}
