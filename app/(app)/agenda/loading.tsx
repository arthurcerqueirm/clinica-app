import { Tela } from "@/components/ui/tela";
import { Skeleton } from "@/components/ui/skeleton";
import { GradeSkeleton } from "@/components/agenda/grade-skeleton";

export default function AgendaLoading() {
  return (
    <Tela>
      <header className="flex flex-col gap-1 pt-2.5">
        <h1 className="px-4 text-[26px] font-bold tracking-tight text-text">Agenda</h1>
        <Skeleton className="mx-4 h-11 rounded-full" />
        <div className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-4 w-40 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
      <GradeSkeleton visao="dia" />
    </Tela>
  );
}
