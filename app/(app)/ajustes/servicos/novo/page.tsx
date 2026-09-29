import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { ServicoForm } from "@/components/servicos/servico-form";
import { criarServico } from "@/lib/actions/servicos";

export default function NovoServicoPage() {
  return (
    <Tela>
      <PageHeader titulo="Novo serviço" voltarPara="/ajustes/servicos" />
      <ServicoForm action={criarServico} textoBotao="Cadastrar" />
    </Tela>
  );
}
