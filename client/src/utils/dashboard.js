export function getDashboardSummary(appointments) {
  const active = appointments.filter((appointment) => appointment.status !== "Cancelado");
  const completed = active.filter((appointment) => Boolean(appointment.atendimento_id));
  const confirmed = active.filter((appointment) => /confirm/i.test(appointment.status || ""));
  const pending = active.filter((appointment) => !appointment.atendimento_id);

  return {
    total: active.length,
    completed: completed.length,
    confirmed: confirmed.length,
    pending,
  };
}

export function appointmentStatus(appointment) {
  if (appointment.atendimento_id) return { label: "Concluído", tone: "success" };
  if (/confirm/i.test(appointment.status || "")) return { label: "Confirmada", tone: "brand" };
  return { label: appointment.status || "Aguardando", tone: "warning" };
}
