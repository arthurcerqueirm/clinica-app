import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({
  titulo,
  voltarPara,
  acao,
  className,
}: {
  titulo: string;
  voltarPara?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      {voltarPara && (
        <Link
          href={voltarPara}
          className="no-select -ml-2 flex h-9 w-9 items-center justify-center rounded-full text-text active:bg-surface-alt"
          aria-label="Voltar"
        >
          <ChevronLeft size={22} />
        </Link>
      )}
      <h1 className="flex-1 truncate text-[17px] font-semibold text-text">{titulo}</h1>
      {acao}
    </header>
  );
}
