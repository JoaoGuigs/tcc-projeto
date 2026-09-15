const db = require("../../database");

async function getAll(professionalId) {
  const [rows] = await db.query(
    `SELECT le.id, le.paciente_id, le.data_preferida, le.periodo, le.observacoes,
       le.status, le.criado_em, p.nome_completo AS paciente_nome, p.celular
     FROM lista_espera le JOIN pacientes p ON p.id = le.paciente_id
     WHERE le.profissional_id = ? AND le.status <> 'Removido'
     ORDER BY FIELD(le.status, 'Aguardando', 'Contatado', 'Agendado'), le.criado_em ASC`,
    [professionalId],
  );
  return rows;
}

async function create(professionalId, data) {
  const [patient] = await db.query("SELECT id FROM pacientes WHERE id = ? LIMIT 1", [data.paciente_id]);
  if (!patient.length) {
    const error = new Error("Paciente não encontrado.");
    error.statusCode = 404;
    throw error;
  }
  const [result] = await db.query(
    `INSERT INTO lista_espera (paciente_id, profissional_id, data_preferida, periodo, observacoes)
     VALUES (?, ?, ?, ?, ?)`,
    [data.paciente_id, professionalId, data.data_preferida || null, data.periodo, data.observacoes || null],
  );
  return { id: result.insertId, message: "Paciente adicionado à lista de espera." };
}

async function updateStatus(id, professionalId, status) {
  const [result] = await db.query("UPDATE lista_espera SET status = ? WHERE id = ? AND profissional_id = ?", [status, id, professionalId]);
  if (!result.affectedRows) {
    const error = new Error("Item da lista de espera não encontrado.");
    error.statusCode = 404;
    throw error;
  }
  return { message: "Lista de espera atualizada." };
}

module.exports = { getAll, create, updateStatus };
