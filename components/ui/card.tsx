import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-(--shadow-sm)",
        className,
      )}
      {...props}
    />
  );
}
