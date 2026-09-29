import { Plus } from "lucide-react";
import { Tela } from "@/components/ui/tela";
import { PageHeader, AcaoHeader } from "@/components/ui/page-header";
import { PacotesList } from "@/components/pacotes/pacotes-list";
import { listarTodosPacotes } from "@/lib/data/pacotes";

export default async function PacotesPage() {
  const pacotes = await listarTodosPacotes();

  return (
    <Tela>
      <PageHeader
        titulo="Pacotes"
        voltarPara="/financeiro"
        acao={
          <AcaoHeader href="/financeiro/pacotes/novo" label="Novo pacote">
            <Plus size={21} />
          </AcaoHeader>
        }
      />
      <PacotesList pacotes={pacotes} />
    </Tela>
  );
}
