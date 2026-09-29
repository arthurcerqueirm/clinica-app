"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Package, UserPlus, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Chip } from "@/components/ui/chip";
import { Grupo } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData } from "@/lib/datas";
import { normalizarTexto } from "@/lib/texto";
import { toque } from "@/lib/motion";
import type { ClienteComResumo } from "@/lib/data/clientes";

type Filtro = "todos" | "devendo" | "pacote" | "inativos";

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "devendo", label: "Devendo" },
  { valor: "pacote", label: "Com pacote ativo" },
  { valor: "inativos", label: "Inativos há 60d" },
];

const SESSENTA_DIAS_MS = 60 * 24 * 60 * 60 * 1000;

export function ClientesList({ clientes }: { clientes: ClienteComResumo[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [agora] = useState(() => Date.now());

  const clientesFiltrados = useMemo(() => {
    const buscaNormalizada = normalizarTexto(busca);

    return clientes.filter((cliente) => {
      if (filtro === "devendo" && cliente.saldoDevedor <= 0) return false;
      if (filtro === "pacote" && !cliente.temPacoteAtivo) return false;
      if (filtro === "inativos") {
        const inativo =
          !cliente.ultimoAtendimento ||
          agora - new Date(cliente.ultimoAtendimento).getTime() > SESSENTA_DIAS_MS;
        if (!inativo) return false;
      }

      if (!buscaNormalizada) return true;

      const nomeNormalizado = normalizarTexto(cliente.nome);
      const telefoneDigitos = (cliente.telefone ?? "").replace(/\D/g, "");
      const buscaDigitos = busca.replace(/\D/g, "");

      return (
        nomeNormalizado.includes(buscaNormalizada) ||
        (buscaDigitos.length >= 3 && telefoneDigitos.includes(buscaDigitos))
      );
    });
  }, [clientes, busca, filtro, agora]);

  const grupos = useMemo(() => agruparPorLetra(clientesFiltrados), [clientesFiltrados]);

  if (clientes.length === 0) {
    return (
      <PlaceholderScreen
        icone={UserPlus}
        titulo="Nenhuma cliente cadastrada"
        descricao="Cadastre a primeira cliente para começar a usar a agenda."
      >
        <Link
          href="/clientes/novo"
          transitionTypes={["avancar"]}
          className="pressable inline-flex rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-bg shadow-(--shadow-md)"
        >
          Cadastrar cliente
        </Link>
      </PlaceholderScreen>
    );
  }

  let indice = 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pb-2 pt-1">
        <div className="surgir relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            type="search"
            placeholder="Buscar por nome ou telefone"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="rounded-full pl-11 pr-11"
          />
          <AnimatePresence>
            {busca && (
              <motion.button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setBusca("")}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={toque}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-surface-alt text-text-muted"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div
          className="surgir -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {FILTROS.map((item) => (
            <Chip
              key={item.valor}
              grupo="filtro-clientes"
              ativo={filtro === item.valor}
              onClick={() => setFiltro(item.valor)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="surgir px-4 py-16 text-center text-sm text-text-muted">
          Nenhuma cliente encontrada.
        </p>
      ) : (
        <div key={filtro} className="flex flex-col pb-4">
          {grupos.map(([letra, itens]) => (
            <div key={letra}>
              <div className="sticky top-15 z-10 bg-bg/85 px-5 pt-3 pb-1.5 text-[13px] font-bold text-primary backdrop-blur-xl">
                {letra}
              </div>
              <Grupo indice={indice++}>
                {itens.map((cliente) => (
                  <ClienteRow key={cliente.id} cliente={cliente} />
                ))}
              </Grupo>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClienteRow({ cliente }: { cliente: ClienteComResumo }) {
  return (
    <Link
      href={`/clientes/${cliente.id}`}
      transitionTypes={["avancar"]}
      className="flex items-center gap-3 px-4 py-3 active:bg-surface-alt"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-semibold text-primary">
        {cliente.nome.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-text">{cliente.nome}</p>
        <p className="truncate text-[13px] text-text-muted">
          {cliente.ultimoAtendimento
            ? `Última visita: ${formatarData(cliente.ultimoAtendimento)}`
            : "Ainda não atendida"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {cliente.temPacoteAtivo && <Package size={16} className="text-primary" />}
        {cliente.saldoDevedor > 0 && (
          <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[12px] font-semibold text-danger">
            {formatarCentavos(cliente.saldoDevedor)}
          </span>
        )}
        <ChevronRight size={17} className="text-text-muted/60" />
      </div>
    </Link>
  );
}

function agruparPorLetra(
  clientes: ClienteComResumo[],
): [string, ClienteComResumo[]][] {
  const grupos = new Map<string, ClienteComResumo[]>();

  for (const cliente of clientes) {
    const letra = normalizarTexto(cliente.nome).charAt(0).toUpperCase() || "#";
    if (!grupos.has(letra)) grupos.set(letra, []);
    grupos.get(letra)!.push(cliente);
  }

  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
}
