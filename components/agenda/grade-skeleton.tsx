import { Skeleton } from "@/components/ui/skeleton";
import type { VisaoAgenda } from "@/lib/agenda-grade";

export function GradeSkeleton({ visao }: { visao: VisaoAgenda }) {
  if (visao === "lista") {
    return (
      <div className="flex flex-col gap-2 px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visao === "mes") {
    return (
      <div className="grid grid-cols-7 gap-1.5 px-3 py-3">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    );
  }

  const colunas = visao === "semana" ? 7 : 1;

  return (
    <div className="flex gap-2 px-4 py-3">
      <div className="flex w-10 shrink-0 flex-col gap-6 pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8 rounded-full" />
        ))}
      </div>
      <div
        className="grid flex-1 gap-1.5"
        style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: colunas }).map((_, i) => (
          <Skeleton key={i} className="h-105 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
