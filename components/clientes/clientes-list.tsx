"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Package, Cake, UserPlus } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { formatarCentavos } from "@/lib/dinheiro";
import { formatarData } from "@/lib/datas";
import { normalizarTexto } from "@/lib/texto";
import type { ClienteComResumo } from "@/lib/data/clientes";

type Filtro = "todos" | "devendo" | "pacote" | "inativos" | "aniversariantes";

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "devendo", label: "Devendo" },
  { valor: "pacote", label: "Com pacote ativo" },
  { valor: "inativos", label: "Inativos há 60d" },
  { valor: "aniversariantes", label: "Aniversariantes" },
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
      if (filtro === "aniversariantes" && !cliente.aniversarianteHoje) return false;
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-3">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            placeholder="Buscar por nome ou telefone"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTROS.map((item) => (
            <Chip
              key={item.valor}
              ativo={filtro === item.valor}
              onClick={() => setFiltro(item.valor)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </div>

      {clientes.length === 0 ? (
        <EstadoVazioGeral />
      ) : grupos.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-text-muted">
          Nenhuma cliente encontrada.
        </p>
      ) : (
        <div className="flex-1 pb-4">
          {grupos.map(([letra, itens]) => (
            <div key={letra}>
              <div className="sticky top-0 z-10 bg-bg px-4 py-1.5 text-[13px] font-semibold text-text-muted">
                {letra}
              </div>
              {itens.map((cliente) => (
                <ClienteRow key={cliente.id} cliente={cliente} />
              ))}
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
      className="flex items-center gap-3 px-4 py-3 active:bg-surface-alt"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[15px] font-semibold text-primary">
        {cliente.nome.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-text">{cliente.nome}</p>
        <p className="truncate text-[13px] text-text-muted">
          {cliente.ultimoAtendimento
            ? `Última visita: ${formatarData(cliente.ultimoAtendimento)}`
            : "Ainda não atendida"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {cliente.aniversarianteHoje && <Cake size={16} className="text-accent" />}
        {cliente.temPacoteAtivo && <Package size={16} className="text-primary" />}
        {cliente.saldoDevedor > 0 && (
          <span className="rounded-full bg-danger/10 px-2 py-1 text-[12px] font-medium text-danger">
            {formatarCentavos(cliente.saldoDevedor)}
          </span>
        )}
      </div>
    </Link>
  );
}

function EstadoVazioGeral() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <UserPlus size={26} />
      </div>
      <h2 className="text-lg font-semibold text-text">Nenhuma cliente cadastrada</h2>
      <p className="max-w-xs text-sm text-text-muted">
        Cadastre a primeira cliente para começar a usar a agenda.
      </p>
      <Link
        href="/clientes/novo"
        className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-[15px] font-medium text-bg"
      >
        Cadastrar cliente
      </Link>
    </div>
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
