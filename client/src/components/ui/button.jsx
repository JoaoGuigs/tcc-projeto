import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  default:
    "bg-brand text-white shadow-[0_1px_0_rgba(31,42,36,0.08)] hover:-translate-y-px hover:bg-[#245a54] hover:shadow-md active:translate-y-0 active:scale-[0.98]",
  outline:
    "border border-line bg-white text-ink hover:-translate-y-px hover:border-primary/40 hover:bg-canvas hover:shadow-sm active:translate-y-0 active:scale-[0.98]",
  ghost: "text-muted hover:bg-canvas hover:text-ink active:scale-[0.98]",
  danger: "bg-[#75413d] text-white hover:-translate-y-px hover:bg-[#613330] hover:shadow-md active:translate-y-0 active:scale-[0.98]",
};

export const Button = forwardRef(function Button({ className, variant = "default", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn("inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-150 motion-reduce:transition-colors motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none", variants[variant], className)} {...props} />;
});
