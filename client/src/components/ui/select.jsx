import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { MenuItem, Select as MuiSelect } from "@mui/material";
import { cn } from "../../lib/utils";

/**
 * Select polido no padrão FisioCare (Operate mode: escaneável, consistente).
 * Usa <select> nativo por acessibilidade + teclado + mobile (skill ui-ux-pro-max:
 * preferir controles nativos; vercel: sem lib pesada como react-select).
 *
 * Uso:
 *   <Select value={v} onChange={e => setV(e.target.value)} options={[{value:'a',label:'A'}]} placeholder="Escolha…" />
 *   ou com <option> como children.
 */
export const Select = forwardRef(function Select(
  { className, wrapperClassName, options, placeholder, children, error, disabled, id, ...props },
  ref
) {
  return (
    <span className={cn("relative flex w-full", wrapperClassName)}>
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-white py-0 pl-3 pr-10 text-sm font-medium text-ink shadow-[0_1px_0_rgba(31,42,36,0.03)] outline-none transition-all duration-150",
          "hover:border-primary/50 hover:bg-[#fbfaf7] hover:shadow-sm",
          "focus:border-primary focus:ring-2 focus:ring-primary/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-border disabled:hover:bg-white disabled:hover:shadow-none",
          error && "border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/10",
          className
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled={props.required}>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              )
            )
          : children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-transform duration-150 peer-focus:rotate-180"
      />
    </span>
  );
});

function PrettyChevron(props) {
  const { className, ...other } = props;
  return <ChevronDown size={16} aria-hidden="true" className={className} {...other} />;
}

const prettySelectSx = {
  height: "44px", // mesma altura do PrettyDatePicker (FIELD_HEIGHT) — manter sincronizado
  borderRadius: "12px",
  backgroundColor: "#fff",
  fontSize: "14px",
  fontWeight: 500,
  color: "#1f2a24",
  boxShadow: "0 1px 0 rgba(31,42,36,0.03)",
  transition: "border-color .15s ease, box-shadow .15s ease",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e6e2da" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(47,111,104,.5)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2f6f68", borderWidth: "1px" },
  "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(47,111,104,.12)" },
  "&.Mui-disabled": { backgroundColor: "#f7f5f1", opacity: 0.65 },
  "& .MuiSelect-select": {
    padding: "0 14px",
    height: "44px !important",
    minHeight: "0 !important",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": { color: "#66736c", right: "10px" },
};

const prettyMenuProps = {
  PaperProps: {
    sx: {
      borderRadius: "16px",
      border: "1px solid #e6e2da",
      boxShadow: "0 12px 32px rgba(31,42,36,.14)",
      marginTop: "4px",
      "& .MuiMenuItem-root": {
        fontSize: "14px",
        fontWeight: 500,
        color: "#1f2a24",
        padding: "10px 14px",
        transition: "background-color .12s ease",
        "&:hover": { backgroundColor: "#d9e8e4" },
        "&.Mui-selected": {
          backgroundColor: "#d9e8e4",
          fontWeight: 700,
          "&:hover": { backgroundColor: "#cce0db" },
        },
      },
    },
  },
};

/**
 * PrettySelect — mesma altura (44px), raio, borda e foco do PrettyDatePicker,
 * com dropdown bonito do MUI em vez da lista feia do navegador.
 * onChange recebe a string direta (não o evento):
 *
 *   <PrettySelect value={v} onChange={(next) => setV(next)} options={["A", "B"]} />
 *   <PrettySelect value={v} onChange={setV} placeholder="Particular (sem convênio)"
 *     options={[{ value: "1", label: "Saúde+" }]} />
 */
export function PrettySelect({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  wrapperClassName,
  ariaLabel,
  ...rest
}) {
  return (
    <span className={cn("block w-full", wrapperClassName)}>
      <MuiSelect
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        displayEmpty
        disabled={disabled}
        fullWidth
        IconComponent={PrettyChevron}
        MenuProps={prettyMenuProps}
        sx={prettySelectSx}
        inputProps={{ "aria-label": ariaLabel }}
        {...rest}
      >
        {placeholder !== undefined && <MenuItem value="">{placeholder}</MenuItem>}
        {options.map((opt) =>
          typeof opt === "string" ? (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ) : (
            <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </MenuItem>
          )
        )}
      </MuiSelect>
    </span>
  );
}
