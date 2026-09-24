import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PacotesList } from "@/components/pacotes/pacotes-list";
import { listarTodosPacotes } from "@/lib/data/pacotes";

export default async function PacotesPage() {
  const pacotes = await listarTodosPacotes();

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        titulo="Pacotes"
        voltarPara="/financeiro"
        acao={
          <Link
            href="/financeiro/pacotes/novo"
            aria-label="Novo pacote"
            className="no-select flex h-9 w-9 items-center justify-center rounded-full text-primary active:bg-surface-alt"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <PacotesList pacotes={pacotes} />
    </div>
  );
}
