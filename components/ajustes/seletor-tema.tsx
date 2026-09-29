"use client";

import { useEffect, useState } from "react";
import { Segmentado } from "@/components/ui/segmentado";
import { aplicarTema, atualizarCorStatusBar, lerTemaSalvo, salvarTema, type Tema } from "@/lib/tema";

const OPCOES = [
  { valor: "sistema", label: "Sistema" },
  { valor: "claro", label: "Claro" },
  { valor: "escuro", label: "Escuro" },
] as const satisfies readonly { valor: Tema; label: string }[];

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

  return <Segmentado id="tema" opcoes={OPCOES} valor={tema} onChange={escolher} />;
}
