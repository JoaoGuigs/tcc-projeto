import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  default: "bg-brand text-white hover:bg-[#245a54]",
  outline: "border border-line bg-white text-ink hover:bg-canvas",
  ghost: "text-muted hover:bg-canvas hover:text-ink",
};

export const Button = forwardRef(function Button({ className, variant = "default", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />;
});
