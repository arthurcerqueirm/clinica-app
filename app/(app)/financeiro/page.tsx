import Link from "next/link";
import { HandCoins, Receipt, Package, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EvolucaoChart } from "@/components/financeiro/evolucao-chart";
import { buscarResumoMesAtual, buscarEvolucaoMensal, buscarProjecaoAgendada } from "@/lib/data/financeiro";
import { formatarCentavos } from "@/lib/dinheiro";

const LINKS = [
  { href: "/financeiro/inadimplentes", icone: HandCoins, titulo: "Quem está devendo" },
  { href: "/financeiro/despesas", icone: Receipt, titulo: "Despesas" },
  { href: "/financeiro/pacotes", icone: Package, titulo: "Pacotes" },
];

export default async function FinanceiroPage() {
  const [resumo, evolucao, projecao] = await Promise.all([
    buscarResumoMesAtual(),
    buscarEvolucaoMensal(6),
    buscarProjecaoAgendada(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Financeiro" />

      <div className="flex flex-col gap-4 px-4 py-4">
        <div>
          <p className="text-[13px] text-text-muted">Este mês</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-[13px] font-medium text-text-muted">Entradas</p>
            <p className="mt-1 text-[18px] font-semibold text-text">
              {formatarCentavos(resumo.entradas)}
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-medium text-text-muted">Saídas</p>
            <p className="mt-1 text-[18px] font-semibold text-text">
              {formatarCentavos(resumo.saidas)}
            </p>
          </Card>
          <Card>
            <p className="text-[13px] font-medium text-text-muted">Resultado</p>
            <p
              className={`mt-1 text-[18px] font-semibold ${resumo.resultado >= 0 ? "text-success" : "text-danger"}`}
            >
              {formatarCentavos(resumo.resultado)}
            </p>
          </Card>
          <Link href="/financeiro/inadimplentes">
            <Card className="active:bg-surface-alt">
              <p className="text-[13px] font-medium text-text-muted">A receber</p>
              <p className="mt-1 text-[18px] font-semibold text-danger">
                {formatarCentavos(resumo.aReceber)}
              </p>
              {resumo.clientesDevendo > 0 && (
                <p className="mt-0.5 text-[12px] text-text-muted">
                  {resumo.clientesDevendo}{" "}
                  {resumo.clientesDevendo === 1 ? "cliente" : "clientes"}
                </p>
              )}
            </Card>
          </Link>
        </div>

        {projecao > 0 && (
          <Card className="bg-primary-soft">
            <p className="text-[13px] font-medium text-primary">Projeção (agendado)</p>
            <p className="mt-1 text-[16px] font-semibold text-primary">
              {formatarCentavos(projecao)}
            </p>
          </Card>
        )}

        <div>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
            Evolução — últimos 6 meses
          </p>
          <Card>
            <EvolucaoChart dados={evolucao} />
          </Card>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border border-t border-border">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <link.icone size={19} />
            </div>
            <p className="flex-1 text-[15px] font-medium text-text">{link.titulo}</p>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
