import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shimmer rounded-xl", className)} aria-hidden {...props} />;
}
