"use client";

import { useRouter } from "next/navigation";
import { motion, type PanInfo } from "motion/react";
import { avancarData, type VisaoAgenda } from "@/lib/agenda-grade";

const LIMIAR_PX = 60;

export function AgendaSwipe({
  visao,
  dataISO,
  children,
}: {
  visao: VisaoAgenda;
  dataISO: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  if (visao === "lista") return <div className="flex flex-1 flex-col">{children}</div>;

  function ir(delta: 1 | -1) {
    router.push(`/agenda?visao=${visao}&data=${avancarData(dataISO, visao, delta)}`, {
      scroll: false,
      transitionTypes: [delta === 1 ? "avancar" : "voltar"],
    });
  }

  function aoSoltarArraste(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x <= -LIMIAR_PX) ir(1);
    else if (info.offset.x >= LIMIAR_PX) ir(-1);
  }

  return (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      dragTransition={{ bounceStiffness: 500, bounceDamping: 32 }}
      onDragEnd={aoSoltarArraste}
      className="flex flex-1 touch-pan-y flex-col"
    >
      {children}
    </motion.div>
  );
}
