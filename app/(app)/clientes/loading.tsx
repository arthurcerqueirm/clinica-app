import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientesLoading() {
  return (
    <Tela>
      <PageHeader titulo="Clientes" />

      <div className="flex flex-col gap-3 px-4 pb-2 pt-1">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <Skeleton className="mx-5 mt-3 mb-1.5 h-3 w-4 rounded-full" />
      <div className="mx-4 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-1/2 rounded-full" />
              <Skeleton className="mt-2 h-3 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Tela>
  );
}
