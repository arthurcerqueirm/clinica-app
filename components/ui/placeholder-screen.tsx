import type { LucideIcon } from "lucide-react";

export function PlaceholderScreen({
  icone: Icone,
  titulo,
  descricao,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="pop flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icone size={28} />
      </div>
      <h2 className="surgir text-lg font-semibold text-text" style={{ "--i": 1 } as React.CSSProperties}>
        {titulo}
      </h2>
      <p
        className="surgir max-w-xs text-sm text-text-muted"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        {descricao}
      </p>
      {children && (
        <div className="surgir mt-2" style={{ "--i": 3 } as React.CSSProperties}>
          {children}
        </div>
      )}
    </div>
  );
}
