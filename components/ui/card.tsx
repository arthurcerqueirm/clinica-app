import { cn } from "@/lib/cn";

type ComIndice = { indice?: number };

function estiloIndice(indice: number | undefined, style: React.CSSProperties | undefined) {
  return indice === undefined ? style : ({ ...style, "--i": indice } as React.CSSProperties);
}

export function Card({ className, indice, style, ...props }: React.ComponentProps<"div"> & ComIndice) {
  return (
    <div
      className={cn(
        "surgir rounded-2xl border border-border bg-surface p-4 shadow-(--shadow-sm)",
        className,
      )}
      style={estiloIndice(indice, style)}
      {...props}
    />
  );
}

// Lista "inset grouped" estilo iOS: linhas dentro de um cartão arredondado.
export function Grupo({ className, indice, style, ...props }: React.ComponentProps<"div"> & ComIndice) {
  return (
    <div
      className={cn(
        "surgir mx-4 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-sm)",
        className,
      )}
      style={estiloIndice(indice, style)}
      {...props}
    />
  );
}

export function SecaoForm({
  titulo,
  indice = 0,
  className,
  children,
}: {
  titulo?: string;
  indice?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "surgir flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-(--shadow-sm)",
        className,
      )}
      style={{ "--i": indice } as React.CSSProperties}
    >
      {titulo && (
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {titulo}
        </h2>
      )}
      {children}
    </section>
  );
}

export function TituloSecao({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "px-5 pt-5 pb-2 text-[13px] font-semibold uppercase tracking-wide text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
