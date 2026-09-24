"use client";

import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import type { VisaoAgenda } from "@/lib/agenda-grade";

const OPCOES: { valor: VisaoAgenda; label: string }[] = [
  { valor: "dia", label: "Dia" },
  { valor: "semana", label: "Semana" },
  { valor: "mes", label: "Mês" },
  { valor: "lista", label: "Lista" },
];

export function SeletorVisao({ visao, dataISO }: { visao: VisaoAgenda; dataISO: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2">
      {OPCOES.map((opcao) => (
        <Chip
          key={opcao.valor}
          ativo={visao === opcao.valor}
          onClick={() => router.push(`/agenda?visao=${opcao.valor}&data=${dataISO}`)}
        >
          {opcao.label}
        </Chip>
      ))}
    </div>
  );
}
