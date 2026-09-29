import { Tela } from "@/components/ui/tela";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto genérico dos loading.tsx: o cabeçalho real (com o "voltar"
// funcionando) aparece na hora e o conteúdo chega por streaming.
export function TelaCarregando({
  titulo,
  voltarPara,
  tipo = "lista",
}: {
  titulo: string;
  voltarPara?: string;
  tipo?: "lista" | "form" | "cards";
}) {
  return (
    <Tela>
      <PageHeader titulo={titulo} voltarPara={voltarPara} />
      {tipo === "lista" && <EsqueletoLista />}
      {tipo === "form" && <EsqueletoForm />}
      {tipo === "cards" && <EsqueletoCards />}
    </Tela>
  );
}

function EsqueletoLista() {
  return (
    <div className="mx-4 mt-1 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-1/2 rounded-full" />
            <Skeleton className="mt-2 h-3 w-1/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EsqueletoForm() {
  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {[3, 2].map((campos, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
          <Skeleton className="h-3 w-24 rounded-full" />
          {Array.from({ length: campos }).map((_, j) => (
            <div key={j}>
              <Skeleton className="mb-2 h-3 w-20 rounded-full" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

function EsqueletoCards() {
  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      <Skeleton className="h-22 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="mt-2.5 h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
