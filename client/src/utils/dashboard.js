export function getDashboardSummary(appointments) {
  const active = appointments.filter((appointment) => appointment.status !== "Cancelado");
  const completed = active.filter((appointment) => Boolean(appointment.atendimento_id));
  const confirmed = active.filter((appointment) => /confirm/i.test(appointment.status || ""));
  // Pendente = sem prontuário E com status que ainda exige ação (Agendado/Confirmado). Faltou/Chegou não contam.
  const pending = active.filter(
    (appointment) => !appointment.atendimento_id && ["Agendado", "Confirmado"].includes(appointment.status || "Agendado"),
  );

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
  if (appointment.status === "Cancelado") return { label: "Cancelado", tone: "muted" };
  if (appointment.status === "Faltou") return { label: "Faltou", tone: "danger" };
  if (appointment.status === "Chegou") return { label: "Chegou", tone: "info" };
  return { label: appointment.status || "Aguardando", tone: "warning" };
}
