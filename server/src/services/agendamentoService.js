const db = require("../../database");

function buildAppointmentQuery(dataInicio, dataFim, pacienteId = null, onlyPending = false, limite = 100, professionalId = null) {
  let sql = `
    SELECT ag.id, ag.data_hora, ag.tipo_consulta, ag.paciente_id, ag.status,
      ag.observacoes, p.nome_completo AS paciente_nome, c.nome_convenio AS convenio,
      p.numero_carteirinha, ag.profissional_id, at.id AS atendimento_id
    FROM agendamentos ag
    JOIN pacientes p ON ag.paciente_id = p.id
    LEFT JOIN convenios c ON p.convenio_id = c.id
    LEFT JOIN atendimentos at ON at.agendamento_id = ag.id
    WHERE ag.status <> 'Cancelado'`;
  const params = [];

  if (pacienteId) { sql += " AND ag.paciente_id = ?"; params.push(pacienteId); }
  if (professionalId) { sql += " AND ag.profissional_id = ?"; params.push(professionalId); }
  if (dataInicio) { sql += " AND ag.data_hora >= ?"; params.push(`${dataInicio} 00:00:00`); }
  if (dataFim) { sql += " AND ag.data_hora < DATE_ADD(?, INTERVAL 1 DAY)"; params.push(`${dataFim} 00:00:00`); }
  if (onlyPending) sql += " AND at.id IS NULL";
  sql += " ORDER BY ag.data_hora ASC LIMIT ?";
  params.push(Number(limite));

  return { sql, params };
}

async function getByDateRange(dataInicio, dataFim, pacienteId = null, onlyPending = false, limite = 100, professionalId = null) {
  const { sql, params } = buildAppointmentQuery(dataInicio, dataFim, pacienteId, onlyPending, limite, professionalId);
  const [appointments] = await db.query(sql, params);
  return appointments.map((appointment) => ({
    ...appointment,
    data_hora: appointment.data_hora instanceof Date ? appointment.data_hora.toISOString() : appointment.data_hora,
  }));
}

async function getAvailableTimesByDate(data, profissionalId) {
  const possibleTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
  ];
  const [bookedTimes] = await db.query(
    `SELECT TIME_FORMAT(data_hora, '%H:%i') AS hora FROM agendamentos
     WHERE data_hora >= ? AND data_hora < DATE_ADD(?, INTERVAL 1 DAY)
       AND profissional_id = ? AND status <> 'Cancelado'`,
    [`${data} 00:00:00`, `${data} 00:00:00`, profissionalId],
  );
  const booked = new Set(bookedTimes.map(({ hora }) => hora));
  return possibleTimes.filter((time) => !booked.has(time));
}

async function create({ paciente_id, profissional_id, data_hora, tipo_consulta, observacoes, status }) {
  try {
    const [result] = await db.query(
      `INSERT INTO agendamentos
       (paciente_id, profissional_id, data_hora, tipo_consulta, observacoes, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, profissional_id, data_hora, tipo_consulta, observacoes || null, status || "Agendado"],
    );
    return { id: result.insertId };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Horário já está ocupado.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
}

async function cancel(id, professionalId = null) {
  let sql = "UPDATE agendamentos SET status = 'Cancelado' WHERE id = ? AND status <> 'Cancelado'";
  const params = [id];
  if (professionalId) {
    sql += " AND profissional_id = ?";
    params.push(professionalId);
  }
  const [result] = await db.query(sql, params);
  if (!result.affectedRows) {
    const error = new Error("Agendamento não encontrado ou já cancelado.");
    error.statusCode = 404;
    throw error;
  }
  return { message: "Agendamento cancelado com sucesso." };
}

async function update(id, professionalId, changes) {
  const allowed = ["data_hora", "tipo_consulta", "observacoes", "status"];
  const entries = Object.entries(changes).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) {
    const error = new Error("Nenhuma alteração informada.");
    error.statusCode = 400;
    throw error;
  }
  const setters = entries.map(([key]) => `${key} = ?`).join(", ");
  const params = entries.map(([, value]) => value);
  params.push(id, professionalId);
  try {
    const [result] = await db.query(
      `UPDATE agendamentos SET ${setters} WHERE id = ? AND profissional_id = ? AND status <> 'Cancelado'`,
      params,
    );
    if (!result.affectedRows) {
      const error = new Error("Agendamento não encontrado ou cancelado.");
      error.statusCode = 404;
      throw error;
    }
    return { message: "Agendamento atualizado com sucesso." };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Este horário já está ocupado.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
}

module.exports = { buildAppointmentQuery, getByDateRange, getAvailableTimesByDate, create, cancel, update };
