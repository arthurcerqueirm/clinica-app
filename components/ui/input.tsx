import { cn } from "@/lib/cn";

const campo =
  "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(campo, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(campo, "resize-none", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(campo, "min-h-12 appearance-none", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block px-1 text-[13px] font-medium text-text-muted", className)}
      {...props}
    />
  );
}

export function CampoErro({ erros }: { erros?: string[] }) {
  if (!erros?.length) return null;
  return <p className="surgir mt-1 px-1 text-[13px] text-danger">{erros[0]}</p>;
}

export function Aviso({
  tipo = "erro",
  className,
  ...props
}: React.ComponentProps<"p"> & { tipo?: "erro" | "sucesso" | "alerta" }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "surgir rounded-2xl px-4 py-3 text-sm",
        tipo === "erro" && "bg-danger/10 text-danger",
        tipo === "sucesso" && "bg-success/10 text-success",
        tipo === "alerta" && "bg-warning/10 text-warning",
        className,
      )}
      {...props}
    />
  );
}
