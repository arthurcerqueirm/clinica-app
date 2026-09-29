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
        "sticky top-0 z-30 flex h-15 shrink-0 items-center gap-2 bg-bg/85 px-4 backdrop-blur-xl",
        className,
      )}
    >
      {voltarPara && (
        <Link
          href={voltarPara}
          transitionTypes={["voltar"]}
          className="no-select pressable -ml-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text shadow-(--shadow-sm) active:bg-surface-alt"
          aria-label="Voltar"
        >
          <ChevronLeft size={22} />
        </Link>
      )}
      <h1
        className={cn(
          "flex-1 truncate font-bold tracking-tight text-text",
          voltarPara ? "text-[18px]" : "text-[26px]",
        )}
      >
        {titulo}
      </h1>
      {acao}
    </header>
  );
}

export function AcaoHeader({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      transitionTypes={["avancar"]}
      className="no-select pressable flex h-10 w-10 items-center justify-center rounded-full bg-primary text-bg shadow-(--shadow-md)"
    >
      {children}
    </Link>
  );
}
