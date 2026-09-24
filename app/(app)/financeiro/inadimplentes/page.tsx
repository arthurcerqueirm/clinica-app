import { PageHeader } from "@/components/ui/page-header";
import { InadimplentesList } from "@/components/financeiro/inadimplentes-list";
import { listarInadimplentes } from "@/lib/data/inadimplentes";
import { buscarConfiguracaoCobranca } from "@/lib/data/configuracoes";
import { formatarCentavos } from "@/lib/dinheiro";

export default async function InadimplentesPage() {
  const [inadimplentes, config] = await Promise.all([
    listarInadimplentes(),
    buscarConfiguracaoCobranca(),
  ]);

  const totalDevido = inadimplentes.reduce((soma, i) => soma + (i.saldo_devedor ?? 0), 0);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Quem está devendo" voltarPara="/financeiro" />
      <div className="px-4 py-3">
        <p className="text-[13px] text-text-muted">A receber</p>
        <p className="text-[22px] font-semibold text-danger">{formatarCentavos(totalDevido)}</p>
        <p className="text-[13px] text-text-muted">
          {inadimplentes.length} {inadimplentes.length === 1 ? "cliente" : "clientes"}
        </p>
      </div>
      <InadimplentesList
        inadimplentes={inadimplentes}
        mensagemTemplate={config.mensagem}
        chavePix={config.chavePix}
      />
    </div>
  );
}
