import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CentavosAnimados } from "@/components/ui/numero-animado";
import { InadimplentesList } from "@/components/financeiro/inadimplentes-list";
import { listarInadimplentes } from "@/lib/data/inadimplentes";
import { buscarConfiguracaoCobranca } from "@/lib/data/configuracoes";

export default async function InadimplentesPage() {
  const [inadimplentes, config] = await Promise.all([
    listarInadimplentes(),
    buscarConfiguracaoCobranca(),
  ]);

  const totalDevido = inadimplentes.reduce((soma, i) => soma + (i.saldo_devedor ?? 0), 0);

  return (
    <Tela>
      <PageHeader titulo="Quem está devendo" voltarPara="/financeiro" />
      <div className="px-4 pt-1 pb-3">
        <Card className="border-danger/20 bg-danger/5">
          <p className="text-[13px] font-medium text-text-muted">A receber</p>
          <CentavosAnimados
            valor={totalDevido}
            className="mt-0.5 block text-[26px] font-bold tracking-tight text-danger"
          />
          <p className="text-[13px] text-text-muted">
            {inadimplentes.length} {inadimplentes.length === 1 ? "cliente" : "clientes"}
          </p>
        </Card>
      </div>
      <InadimplentesList
        inadimplentes={inadimplentes}
        mensagemTemplate={config.mensagem}
        chavePix={config.chavePix}
      />
    </Tela>
  );
}
