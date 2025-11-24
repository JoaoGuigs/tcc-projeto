// server/src/services/agendamentoService.js
const db = require("../../database.js");

// Função para buscar agendamentos (simplificada por enquanto)
const getByDateRange = async (dataInicio, dataFim, pacienteId = null, onlyPending = false) => {
  // Construir a query base
  let sql = `
    SELECT 
      ag.id, 
      ag.data_hora, 
      ag.tipo_consulta, 
      ag.paciente_id,
      ag.status,
      ag.observacoes,
      p.nome_completo AS paciente_nome,
      ag.profissional_id,
      at.id AS atendimento_id
    FROM agendamentos ag
      JOIN pacientes p ON ag.paciente_id = p.id
      LEFT JOIN atendimentos at ON at.agendamento_id = ag.id
    WHERE 1=1
  `;
  
  // Array para armazenar os parâmetros da query
  const params = [];

  // Adicionar filtro por paciente se fornecido
  if (pacienteId) {
    sql += ' AND ag.paciente_id = ?';
    params.push(pacienteId);
  }

  // Adicionar filtro por data inicial se fornecida
  if (dataInicio) {
    sql += ' AND DATE(ag.data_hora) >= DATE(?)';
    params.push(dataInicio);
  }

  // Adicionar filtro por data final se fornecida
  if (dataFim) {
    sql += ' AND DATE(ag.data_hora) <= DATE(?)';
    params.push(dataFim);
  }

  // Se solicitado, retorna apenas agendamentos sem atendimento (prontuário ainda não criado)
  if (onlyPending) {
    sql += ' AND at.id IS NULL';
  }

  // Ordenar por data/hora
  sql += ' ORDER BY ag.data_hora ASC';

  // Executar a query
  const [agendamentos] = await db.query(sql, params);

  // Formatar as datas para o formato ISO e retornar
  return agendamentos.map((ag) => ({
    ...ag,
    data_hora: ag.data_hora ? ag.data_hora.toISOString() : null,
  }));
};

// Função para obter horários disponíveis para uma data específica
const getAvailableTimesByDate = async (data, profissional_id) => {
  // Definir horários possíveis (8h às 17h, intervalos de 30min)
  const possibleTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Buscar agendamentos existentes para a data
  const [bookedTimes] = await db.query(
    `SELECT TIME_FORMAT(data_hora, '%H:%i') as hora
     FROM agendamentos
     WHERE DATE(data_hora) = DATE(?)
     AND profissional_id = ?
     AND status != 'Cancelado'`,
    [data, profissional_id]
  );

  // Converter horários agendados para um Set para fácil verificação
  const bookedTimesSet = new Set(bookedTimes.map(t => t.hora));

  // Retornar apenas os horários que não estão agendados
  return possibleTimes.filter(time => !bookedTimesSet.has(time));
};

// Função para verificar se um horário está disponível
const isTimeSlotAvailable = async (data_hora, profissional_id) => {
  const [existingAppointments] = await db.query(
    `SELECT id FROM agendamentos 
     WHERE profissional_id = ? 
     AND data_hora = ?
     AND status != 'Cancelado'`,
    [profissional_id, data_hora]
  );
  return existingAppointments.length === 0;
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

  // Verifica se o horário está disponível
  const isAvailable = await isTimeSlotAvailable(data_hora, profissional_id);
  if (!isAvailable) {
    throw new Error("Horário já está ocupado.");
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

// Função para CANCELAR um agendamento
const cancel = async (id) => {
  if (!id) {
    throw new Error("ID do agendamento é obrigatório.");
  }

  // Verificar se o agendamento existe
  const [agendamento] = await db.query(
    'SELECT id, status FROM agendamentos WHERE id = ?',
    [id]
  );

  if (agendamento.length === 0) {
    throw new Error("Agendamento não encontrado.");
  }

  if (agendamento[0].status === 'Cancelado') {
    throw new Error("Agendamento já está cancelado.");
  }

  // Atualizar o status para 'Cancelado'
  const sql = 'UPDATE agendamentos SET status = ? WHERE id = ?';
  await db.query(sql, ['Cancelado', id]);

  return { message: 'Agendamento cancelado com sucesso' };
};

module.exports = {
  getByDateRange,
  getAvailableTimesByDate,
  create,
  cancel,
};
