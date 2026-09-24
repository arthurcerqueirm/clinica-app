"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { aplicarTema, atualizarCorStatusBar, lerTemaSalvo, salvarTema, type Tema } from "@/lib/tema";

const OPCOES: { valor: Tema; label: string }[] = [
  { valor: "sistema", label: "Sistema" },
  { valor: "claro", label: "Claro" },
  { valor: "escuro", label: "Escuro" },
];

export function SeletorTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(lerTemaSalvo());
  }, []);

  useEffect(() => {
    if (tema !== "sistema") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const atualizar = () => atualizarCorStatusBar("sistema");
    media.addEventListener("change", atualizar);
    return () => media.removeEventListener("change", atualizar);
  }, [tema]);

  function escolher(novoTema: Tema) {
    setTema(novoTema);
    salvarTema(novoTema);
    aplicarTema(novoTema);
  }

  return (
    <div className="flex gap-2 px-4 py-3.5">
      {OPCOES.map((opcao) => (
        <Chip
          key={opcao.valor}
          ativo={tema === opcao.valor}
          onClick={() => escolher(opcao.valor)}
        >
          {opcao.label}
        </Chip>
      ))}
    </div>
  );
}
