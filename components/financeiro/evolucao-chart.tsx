"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatarCentavos } from "@/lib/dinheiro";
import type { Tables } from "@/types/database";

type PontoEvolucao = Tables<"vw_fluxo_caixa_mensal">;

const NOMES_MES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function EvolucaoChart({ dados }: { dados: PontoEvolucao[] }) {
  const dadosFormatados = dados.map((d) => ({
    label: formatarMesAbreviado(d.mes),
    entradas: (d.entradas ?? 0) / 100,
    saidas: (d.saidas ?? 0) / 100,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dadosFormatados}
          barGap={2}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            tickFormatter={formatarCompacto}
            width={36}
          />
          <Tooltip
            formatter={(valor) => formatarCentavos(Math.round(Number(valor) * 100))}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--text)" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(valor) => (
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {valor === "entradas" ? "Entradas" : "Saídas"}
              </span>
            )}
          />
          <Bar
            dataKey="entradas"
            fill="var(--chart-entradas)"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
          <Bar dataKey="saidas" fill="var(--chart-saidas)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatarMesAbreviado(mesISO: string | null): string {
  if (!mesISO) return "";
  const [ano, mes] = mesISO.split("-");
  return `${NOMES_MES[Number(mes) - 1]}/${ano.slice(2)}`;
}

function formatarCompacto(valorReais: number): string {
  if (Math.abs(valorReais) >= 1000) return `${(valorReais / 1000).toFixed(1)}k`;
  return String(Math.round(valorReais));
}
