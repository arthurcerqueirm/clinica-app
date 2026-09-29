"use client";

import { useTransition } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronUp, ChevronDown, Pencil, Wrench } from "lucide-react";
import { Grupo } from "@/components/ui/card";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { formatarCentavos } from "@/lib/dinheiro";
import { mola } from "@/lib/motion";
import { alternarAtivoServicoAction, moverServicoAction } from "@/lib/actions/servicos";
import type { Tables } from "@/types/database";

type Servico = Tables<"servicos">;

export function ServicosList({ servicos }: { servicos: Servico[] }) {
  const [, startTransition] = useTransition();

  if (servicos.length === 0) {
    return (
      <PlaceholderScreen
        icone={Wrench}
        titulo="Nenhum serviço cadastrado"
        descricao="Toque no + para cadastrar as massagens oferecidas."
      />
    );
  }

  return (
    <Grupo className="mt-1">
      {servicos.map((servico, indice) => (
        <motion.div
          key={servico.id}
          layout="position"
          transition={mola}
          className="flex items-center gap-3 bg-surface px-4 py-3"
        >
          <span
            className="h-10 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: servico.cor }}
            aria-hidden
          />

          <div
            className={`min-w-0 flex-1 transition-opacity ${servico.ativo ? "" : "opacity-50"}`}
          >
            <p className="truncate text-[15px] font-semibold text-text">{servico.nome}</p>
            <p className="text-[13px] text-text-muted">
              {servico.duracao_min} min · {formatarCentavos(servico.preco_centavos)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <BotaoIcone
              disabled={indice === 0}
              onClick={() => startTransition(() => moverServicoAction(servico.id, "cima"))}
              aria-label="Mover para cima"
            >
              <ChevronUp size={18} />
            </BotaoIcone>
            <BotaoIcone
              disabled={indice === servicos.length - 1}
              onClick={() => startTransition(() => moverServicoAction(servico.id, "baixo"))}
              aria-label="Mover para baixo"
            >
              <ChevronDown size={18} />
            </BotaoIcone>
            <Link
              href={`/ajustes/servicos/${servico.id}/editar`}
              transitionTypes={["avancar"]}
              className="pressable flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-alt"
              aria-label="Editar"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() =>
                startTransition(() => alternarAtivoServicoAction(servico.id, !servico.ativo))
              }
              className={`pressable ml-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                servico.ativo ? "bg-success/10 text-success" : "bg-surface-alt text-text-muted"
              }`}
            >
              {servico.ativo ? "Ativo" : "Inativo"}
            </button>
          </div>
        </motion.div>
      ))}
    </Grupo>
  );
}

function BotaoIcone(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="pressable flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-alt disabled:opacity-30"
      {...props}
    />
  );
}
