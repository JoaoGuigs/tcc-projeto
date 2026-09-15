import dayjs from "dayjs";

export function getDateRange(viewMode, dataInicio, dataFim, now = dayjs()) {
  if (viewMode === "hoje") {
    const today = now.format("YYYY-MM-DD");
    return { dataInicio: today, dataFim: today };
  }
  if (viewMode === "semana") {
    return { dataInicio: now.startOf("week").format("YYYY-MM-DD"), dataFim: now.endOf("week").format("YYYY-MM-DD") };
  }
  if (viewMode === "mes") {
    return { dataInicio: now.startOf("month").format("YYYY-MM-DD"), dataFim: now.endOf("month").format("YYYY-MM-DD") };
  }
  if (viewMode === "personalizado" && dataInicio && dataFim) return { dataInicio, dataFim };
  return {};
}
