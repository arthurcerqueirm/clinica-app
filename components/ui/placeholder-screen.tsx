import type { LucideIcon } from "lucide-react";

export function PlaceholderScreen({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icone size={26} />
      </div>
      <h1 className="text-lg font-semibold text-text">{titulo}</h1>
      <p className="max-w-xs text-sm text-text-muted">{descricao}</p>
    </div>
  );
}
