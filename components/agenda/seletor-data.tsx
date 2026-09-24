"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatarData, hojeISOemSaoPaulo } from "@/lib/datas";
import { avancarData, type VisaoAgenda } from "@/lib/agenda-grade";

const FORMATO_POR_VISAO: Record<Exclude<VisaoAgenda, "lista">, string> = {
  dia: "EEEE, dd 'de' MMMM",
  semana: "'Semana de' dd 'de' MMMM",
  mes: "MMMM 'de' yyyy",
};

export function SeletorData({ visao, dataISO }: { visao: VisaoAgenda; dataISO: string }) {
  const router = useRouter();

  if (visao === "lista") return null;

  function irPara(novaDataISO: string) {
    router.push(`/agenda?visao=${visao}&data=${novaDataISO}`);
  }

  const hojeISO = hojeISOemSaoPaulo();
  const ehHoje = dataISO === hojeISO;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <button
        type="button"
        onClick={() => irPara(avancarData(dataISO, visao, -1))}
        aria-label="Anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-alt"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex flex-1 items-center justify-center gap-2">
        <span className="text-[15px] font-medium capitalize text-text">
          {formatarData(`${dataISO}T12:00:00`, FORMATO_POR_VISAO[visao])}
        </span>
        {!ehHoje && (
          <button
            type="button"
            onClick={() => irPara(hojeISO)}
            className="rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-medium text-primary"
          >
            Hoje
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => irPara(avancarData(dataISO, visao, 1))}
        aria-label="Próximo"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-alt"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
