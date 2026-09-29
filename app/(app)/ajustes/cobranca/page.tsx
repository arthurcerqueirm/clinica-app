import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { ConfiguracaoCobrancaForm } from "@/components/financeiro/configuracao-cobranca-form";
import { buscarConfiguracaoCobranca } from "@/lib/data/configuracoes";

export default async function ConfiguracaoCobrancaPage() {
  const config = await buscarConfiguracaoCobranca();

  return (
    <Tela>
      <PageHeader titulo="Cobrança" voltarPara="/ajustes" />
      <ConfiguracaoCobrancaForm mensagem={config.mensagem} chavePix={config.chavePix} />
    </Tela>
  );
}
