import { forwardRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "../../lib/utils";

const base =
  "h-11 w-full rounded-xl border border-border bg-white pl-3 pr-10 text-sm font-medium text-ink shadow-[0_1px_0_rgba(31,42,36,0.03)] outline-none transition-all duration-150 hover:border-primary/50 hover:bg-[#fbfaf7] hover:shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55";

/**
 * DateInput / MonthInput polidos — embrulham o input nativo (melhor a11y + mobile,
 * sem custo de react-datepicker / MUI DatePicker — vercel bundle + ui-ux-pro-max).
 * O ícone é decorativo; o picker nativo continua clicável no campo inteiro.
 */
function Field({ icon: Icon, className, wrapperClassName, ...props }, ref) {
  return (
    <span className={cn("relative flex w-full", wrapperClassName)}>
      <input ref={ref} {...props} className={cn(base, "[color-scheme:light]", className)} />
      <Icon
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </span>
  );
}

export const DateInput = forwardRef(function DateInput(props, ref) {
  return <Field {...props} ref={ref} type="date" icon={CalendarDays} />;
});

export const MonthInput = forwardRef(function MonthInput(props, ref) {
  return <Field {...props} ref={ref} type="month" icon={CalendarDays} />;
});
