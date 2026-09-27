import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { cn } from "../../lib/utils";

/**
 * Date/Month pickers bonitos no padrão FisioCare.
 * Usam @mui/x-date-pickers (já instalado no projeto) + dayjs pt-BR,
 * com input e calendário estilizados nos tokens da clínica
 * (borda #e6e2da, raio 12px, foco #2f6f68).
 *
 * API simples com string (sem expor Dayjs para as telas):
 *   <PrettyDatePicker value="2026-09-27" onChange={(next) => setDate(next)} min={...} />
 *   <PrettyMonthPicker value="2026-09" onChange={(next) => setMonth(next)} />
 */

// Altura única dos campos do projeto (h-11): date e select ficam pixel-iguais.
const FIELD_HEIGHT = "44px";

const fieldSx = {
  "& .MuiPickersInputBase-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    height: FIELD_HEIGHT,
    minHeight: FIELD_HEIGHT,
    boxSizing: "border-box",
    fontSize: "14px",
    fontWeight: 500,
    color: "#1f2a24",
    boxShadow: "0 1px 0 rgba(31,42,36,0.03)",
    transition: "border-color .15s ease, box-shadow .15s ease",
    "& fieldset": { borderColor: "#e6e2da" },
    "&:hover fieldset": { borderColor: "rgba(47,111,104,.5)" },
    "&.Mui-focused fieldset": { borderColor: "#2f6f68", borderWidth: "1px" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(47,111,104,.12)" },
    "&.Mui-disabled": { backgroundColor: "#f7f5f1", opacity: 0.65 },
  },
  "& .MuiPickersSectionList-root": {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1f2a24",
    padding: "0 14px 0 0",
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: "#66736c", fontSize: 18 },
  "& .MuiFormHelperText-root": { display: "none" },
};

const popperSx = {
  "& .MuiPaper-root": {
    borderRadius: "16px",
    border: "1px solid #e6e2da",
    boxShadow: "0 12px 32px rgba(31,42,36,.14)",
    overflow: "hidden",
    marginTop: "4px",
  },
  "& .MuiPickersDay-root.Mui-selected": { backgroundColor: "#2f6f68", fontWeight: 700 },
  "& .MuiPickersDay-root.Mui-selected:hover": { backgroundColor: "#245a54" },
  "& .MuiPickersDay-root:not(.Mui-selected):hover": { backgroundColor: "#d9e8e4" },
  "& .MuiPickersDay-root.MuiPickersDay-today:not(.Mui-selected)": {
    borderColor: "#2f6f68",
  },
};

function toDayjsDate(value) {
  if (!value) return null;
  const d = dayjs(value, "YYYY-MM-DD", true);
  return d.isValid() ? d : null;
}

function toDayjsMonth(value) {
  if (!value) return null;
  const d = dayjs(value, "YYYY-MM", true);
  return d.isValid() ? d : null;
}

export function PrettyDatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  wrapperClassName,
  ...rest
}) {
  return (
    <span className={cn("block w-full", wrapperClassName)}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          value={toDayjsDate(value)}
          onChange={(next) => onChange?.(!next || !next.isValid() ? "" : next.format("YYYY-MM-DD"))}
          minDate={min ? dayjs(min, "YYYY-MM-DD") : undefined}
          maxDate={max ? dayjs(max, "YYYY-MM-DD") : undefined}
          format="DD/MM/YYYY"
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: fieldSx,
              inputProps: { inputMode: "numeric", "aria-label": rest["aria-label"] || "Data" },
            },
            popper: { sx: popperSx },
          }}
          {...rest}
        />
      </LocalizationProvider>
    </span>
  );
}

export function PrettyMonthPicker({
  value,
  onChange,
  disabled,
  wrapperClassName,
  ...rest
}) {
  return (
    <span className={cn("block w-full", wrapperClassName)}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          views={["year", "month"]}
          openTo="month"
          value={toDayjsMonth(value)}
          onChange={(next) => onChange?.(!next || !next.isValid() ? "" : next.format("YYYY-MM"))}
          format="MM/YYYY"
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: fieldSx,
              inputProps: { inputMode: "numeric", "aria-label": rest["aria-label"] || "Mês" },
            },
            popper: { sx: popperSx },
          }}
          {...rest}
        />
      </LocalizationProvider>
    </span>
  );
}
