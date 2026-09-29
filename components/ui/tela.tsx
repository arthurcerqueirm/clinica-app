import { ViewTransition } from "react";
import { cn } from "@/lib/cn";

// Precisa ficar em cada page/loading (não no layout): layouts persistem entre
// navegações, então enter/exit nunca disparariam lá.
export function Tela({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ avancar: "avancar", voltar: "voltar", default: "tela-entra" }}
      exit={{ avancar: "avancar", voltar: "voltar", default: "tela-sai" }}
      default="none"
    >
      <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
    </ViewTransition>
  );
}
