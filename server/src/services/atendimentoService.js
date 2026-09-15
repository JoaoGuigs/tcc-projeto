const db = require("../../database");

async function getByPacienteId(pacienteId) {
  const [rows] = await db.query(
    `SELECT at.id AS atendimento_id, at.data_atendimento, at.evolucao_clinica,
       at.procedimentos_realizados, ag.tipo_consulta, ag.data_hora AS data_hora_agendamento
     FROM atendimentos at
     JOIN agendamentos ag ON at.agendamento_id = ag.id
     WHERE ag.paciente_id = ?
     ORDER BY at.data_atendimento DESC
     LIMIT 200`,
    [pacienteId],
  );
  return rows;
}

async function create({ agendamento_id, evolucao_clinica, procedimentos_realizados }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [appointmentRows] = await connection.query(
      "SELECT id, status FROM agendamentos WHERE id = ? FOR UPDATE",
      [agendamento_id],
    );
    if (!appointmentRows.length || appointmentRows[0].status === "Cancelado") {
      const error = new Error("Agendamento não encontrado ou cancelado.");
      error.statusCode = 404;
      throw error;
    }
    const [result] = await connection.query(
      `INSERT INTO atendimentos (agendamento_id, evolucao_clinica, procedimentos_realizados)
       VALUES (?, ?, ?)`,
      [agendamento_id, evolucao_clinica || null, procedimentos_realizados || null],
    );
    await connection.query("UPDATE agendamentos SET status = 'Concluído' WHERE id = ?", [agendamento_id]);
    await connection.commit();
    return { id: result.insertId };
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Este agendamento já possui um prontuário.");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getByPacienteId, create };
