"use client";

import { useRouter } from "next/navigation";
import { Segmentado } from "@/components/ui/segmentado";
import type { VisaoAgenda } from "@/lib/agenda-grade";

const OPCOES = [
  { valor: "dia", label: "Dia" },
  { valor: "semana", label: "Semana" },
  { valor: "mes", label: "Mês" },
  { valor: "lista", label: "Lista" },
] as const satisfies readonly { valor: VisaoAgenda; label: string }[];

export function SeletorVisao({ visao, dataISO }: { visao: VisaoAgenda; dataISO: string }) {
  const router = useRouter();

  return (
    <Segmentado
      id="visao-agenda"
      opcoes={OPCOES}
      valor={visao}
      onChange={(nova) => router.push(`/agenda?visao=${nova}&data=${dataISO}`, { scroll: false })}
      className="mx-4"
    />
  );
}
