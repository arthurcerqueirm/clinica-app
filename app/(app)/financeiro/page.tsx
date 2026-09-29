import Link from "next/link";
import { HandCoins, Receipt, Package, ChevronRight } from "lucide-react";
import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Grupo, TituloSecao } from "@/components/ui/card";
import { CentavosAnimados } from "@/components/ui/numero-animado";
import { EvolucaoChart } from "@/components/financeiro/evolucao-chart";
import { buscarResumoMesAtual, buscarEvolucaoMensal, buscarProjecaoAgendada } from "@/lib/data/financeiro";

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
    <Tela>
      <PageHeader titulo="Financeiro" />

      <div className="flex flex-col gap-3 px-4 pt-1">
        <p className="surgir px-1 text-[13px] font-medium text-text-muted">Este mês</p>

        <div className="grid grid-cols-2 gap-3">
          <Card indice={1}>
            <p className="text-[13px] font-medium text-text-muted">Entradas</p>
            <CentavosAnimados
              valor={resumo.entradas}
              className="mt-1 block text-[19px] font-bold text-text"
            />
          </Card>
          <Card indice={2}>
            <p className="text-[13px] font-medium text-text-muted">Saídas</p>
            <CentavosAnimados
              valor={resumo.saidas}
              className="mt-1 block text-[19px] font-bold text-text"
            />
          </Card>
          <Card indice={3}>
            <p className="text-[13px] font-medium text-text-muted">Resultado</p>
            <CentavosAnimados
              valor={resumo.resultado}
              className={`mt-1 block text-[19px] font-bold ${resumo.resultado >= 0 ? "text-success" : "text-danger"}`}
            />
          </Card>
          <Link
            href="/financeiro/inadimplentes"
            transitionTypes={["avancar"]}
            className="pressable rounded-2xl"
          >
            <Card indice={4} className="h-full active:bg-surface-alt">
              <p className="text-[13px] font-medium text-text-muted">A receber</p>
              <CentavosAnimados
                valor={resumo.aReceber}
                className="mt-1 block text-[19px] font-bold text-danger"
              />
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
          <Card indice={5} className="border-primary/20 bg-primary-soft">
            <p className="text-[13px] font-medium text-primary">Projeção (agendado)</p>
            <CentavosAnimados
              valor={projecao}
              className="mt-1 block text-[17px] font-bold text-primary"
            />
          </Card>
        )}
      </div>

      <TituloSecao className="surgir" style={{ "--i": 6 } as React.CSSProperties}>
        Evolução — últimos 6 meses
      </TituloSecao>
      <div className="px-4">
        <Card indice={6}>
          <EvolucaoChart dados={evolucao} />
        </Card>
      </div>

      <TituloSecao>Gestão</TituloSecao>
      <Grupo indice={7}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            transitionTypes={["avancar"]}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-alt"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <link.icone size={19} />
            </div>
            <p className="flex-1 text-[15px] font-medium text-text">{link.titulo}</p>
            <ChevronRight size={18} className="shrink-0 text-text-muted/60" />
          </Link>
        ))}
      </Grupo>
    </Tela>
  );
}
