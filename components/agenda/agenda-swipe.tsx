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

  function aoSoltarArraste(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x <= -LIMIAR_PX) {
      router.push(`/agenda?visao=${visao}&data=${avancarData(dataISO, visao, 1)}`);
    } else if (info.offset.x >= LIMIAR_PX) {
      router.push(`/agenda?visao=${visao}&data=${avancarData(dataISO, visao, -1)}`);
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      onDragEnd={aoSoltarArraste}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
