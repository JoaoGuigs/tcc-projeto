// server/src/services/agendamentoService.js
const db = require("../../database.js");

// Função para buscar agendamentos (simplificada por enquanto)
const getByDateRange = async (dataInicio, dataFim) => {
  // Dentro de server/src/services/agendamentoService.js -> getByDateRange

  // Query ajustada para incluir paciente_id
  const [agendamentos] = await db.query(`
        SELECT 
            ag.id, 
            ag.data_hora, 
            ag.tipo_consulta, 
            ag.paciente_id,         -- <-- ADICIONADO AQUI
            p.nome_completo AS paciente_nome
        FROM agendamentos AS ag
        JOIN pacientes AS p ON ag.paciente_id = p.id
        ORDER BY ag.data_hora;
    `);

  return agendamentos;
};

// Função para CRIAR um novo agendamento
const create = async (agendamentoData) => {
  const {
    paciente_id,
    profissional_id,
    data_hora,
    tipo_consulta,
    observacoes,
    status,
  } = agendamentoData;

  if (!paciente_id || !profissional_id || !data_hora) {
    throw new Error("Dados insuficientes para criar agendamento.");
  }

  const sql = `
        INSERT INTO agendamentos 
        (paciente_id, profissional_id, data_hora, tipo_consulta, observacoes, status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
  const params = [
    paciente_id,
    profissional_id,
    data_hora,
    tipo_consulta,
    observacoes,
    status || "Agendado",
  ];

  const [result] = await db.query(sql, params);
  return { id: result.insertId };
};

module.exports = {
  getByDateRange,
  create,
};
