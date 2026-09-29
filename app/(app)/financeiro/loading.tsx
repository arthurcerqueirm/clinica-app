import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceiroLoading() {
  return (
    <Tela>
      <PageHeader titulo="Financeiro" />

      <div className="flex flex-col gap-3 px-4 pt-1">
        <Skeleton className="h-4 w-20 rounded-full" />

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="mt-2.5 h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-4 mb-1 ml-1 h-3 w-40 rounded-full" />
        <div className="rounded-2xl border border-border bg-surface p-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>

      <Skeleton className="mx-5 mt-6 mb-2 h-3 w-16 rounded-full" />
      <div className="mx-4 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded-full" />
          </div>
        ))}
      </div>
    </Tela>
  );
}
