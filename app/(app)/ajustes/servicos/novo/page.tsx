import { PageHeader } from "@/components/ui/page-header";
import { ServicoForm } from "@/components/servicos/servico-form";
import { criarServico } from "@/lib/actions/servicos";

export default function NovoServicoPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Novo serviço" voltarPara="/ajustes/servicos" />
      <ServicoForm action={criarServico} textoBotao="Cadastrar" />
    </div>
  );
}
