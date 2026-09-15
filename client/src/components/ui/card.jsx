import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("rounded-2xl border border-line bg-white", className)} {...props} />;
}
