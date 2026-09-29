import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { DespesaForm } from "@/components/financeiro/despesa-form";
import { listarCategorias } from "@/lib/data/despesas";

export default async function NovaDespesaPage() {
  const categorias = await listarCategorias();

  return (
    <Tela>
      <PageHeader titulo="Nova despesa" voltarPara="/financeiro/despesas" />
      <DespesaForm categorias={categorias} />
    </Tela>
  );
}
