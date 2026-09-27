export const queryKeys = {
  usuariosMe: ["usuarios-me"],
  convenios: ["convenios"],
  pacientes: ["pacientes"],
  pacientesAgenda: ["pacientes-agenda"],
  agenda: (range) => ["agenda", range],
  dashboardAgendamentos: (range) => ["dashboard-agendamentos", range],
  availableTimes: (date, profissionalId) => ["available-times", date, profissionalId],
  agendaSlots: ["dashboard-horarios-da-agenda"],
  waitlist: ["waitlist"],
  whatsappConversas: (limite = 50, offset = 0) => ["whatsapp", "conversas", limite, offset],
};
