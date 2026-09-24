import { PageHeader } from "@/components/ui/page-header";
import { DespesaForm } from "@/components/financeiro/despesa-form";
import { listarCategorias } from "@/lib/data/despesas";

export default async function NovaDespesaPage() {
  const categorias = await listarCategorias();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader titulo="Nova despesa" voltarPara="/financeiro/despesas" />
      <DespesaForm categorias={categorias} />
    </div>
  );
}
