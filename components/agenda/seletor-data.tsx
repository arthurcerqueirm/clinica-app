"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatarData, hojeISOemSaoPaulo } from "@/lib/datas";
import { avancarData, type VisaoAgenda } from "@/lib/agenda-grade";
import { mola, toque } from "@/lib/motion";

const FORMATO_POR_VISAO: Record<Exclude<VisaoAgenda, "lista">, string> = {
  dia: "EEEE, dd 'de' MMMM",
  semana: "'Semana de' dd 'de' MMMM",
  mes: "MMMM 'de' yyyy",
};

export function SeletorData({ visao, dataISO }: { visao: VisaoAgenda; dataISO: string }) {
  const router = useRouter();

  if (visao === "lista") return <div className="h-2" />;

  function irPara(novaDataISO: string) {
    const direcao = novaDataISO > dataISO ? "avancar" : "voltar";
    router.push(`/agenda?visao=${visao}&data=${novaDataISO}`, {
      scroll: false,
      transitionTypes: [direcao],
    });
  }

  const hojeISO = hojeISOemSaoPaulo();
  const ehHoje = dataISO === hojeISO;

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <BotaoSeta aria-label="Anterior" onClick={() => irPara(avancarData(dataISO, visao, -1))}>
        <ChevronLeft size={20} />
      </BotaoSeta>

      <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={`${visao}-${dataISO}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={toque}
            className="truncate text-[15px] font-semibold capitalize text-text"
          >
            {formatarData(`${dataISO}T12:00:00`, FORMATO_POR_VISAO[visao])}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {!ehHoje && (
            <motion.button
              type="button"
              onClick={() => irPara(hojeISO)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileTap={{ scale: 0.9 }}
              transition={mola}
              className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[12px] font-semibold text-primary"
            >
              Hoje
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <BotaoSeta aria-label="Próximo" onClick={() => irPara(avancarData(dataISO, visao, 1))}>
        <ChevronRight size={20} />
      </BotaoSeta>
    </div>
  );
}

function BotaoSeta(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-muted shadow-(--shadow-sm) active:bg-surface-alt"
      {...props}
    />
  );
}
