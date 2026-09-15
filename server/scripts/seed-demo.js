require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../../server/database");

function mysqlDate(dayOffset, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
    + " " + pad(hour) + ":" + pad(minute) + ":00";
}

async function ensureProfessional(connection) {
  const password = "FisioCare123!";
  const hash = await bcrypt.hash(password, 12);
  const [user] = await connection.query(
    "INSERT INTO usuarios (nome, email, senha_hash) VALUES ('Dra. Ana Souza', 'ana@fisiocare.demo', ?) "
      + "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), nome = VALUES(nome), senha_hash = VALUES(senha_hash)",
    [hash],
  );
  const [professionals] = await connection.query(
    "SELECT id FROM profissionais WHERE usuario_id = ? LIMIT 1",
    [user.insertId],
  );
  if (professionals[0]) return { id: professionals[0].id, createdLogin: false, password };
  const [professional] = await connection.query(
    "INSERT INTO profissionais (usuario_id, registro_profissional, especialidade) "
      + "VALUES (?, 'CREFITO-DEMO-001', 'Fisioterapia') "
      + "ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), especialidade = VALUES(especialidade)",
    [user.insertId],
  );
  return { id: professional.insertId, createdLogin: true, password };
}

async function ensurePatient(connection, patient) {
  await connection.query(
    "INSERT INTO pacientes (nome_completo, celular, descricao_problema, profissao) "
      + "VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nome_completo = VALUES(nome_completo), "
      + "descricao_problema = VALUES(descricao_problema), profissao = VALUES(profissao)",
    [patient.nome, patient.celular, patient.problema, patient.profissao],
  );
  const [rows] = await connection.query("SELECT id FROM pacientes WHERE celular = ? LIMIT 1", [patient.celular]);
  return rows[0].id;
}

async function ensureAppointment(connection, appointment) {
  await connection.query(
    "INSERT IGNORE INTO agendamentos "
      + "(paciente_id, profissional_id, data_hora, tipo_consulta, observacoes, status) "
      + "VALUES (?, ?, ?, ?, 'Dado de demonstração', ?)",
    [appointment.pacienteId, appointment.profissionalId, appointment.dataHora, appointment.tipo, appointment.status],
  );
  const [rows] = await connection.query(
    "SELECT id FROM agendamentos WHERE profissional_id = ? AND data_hora = ? "
      + "AND status <> 'Cancelado' LIMIT 1",
    [appointment.profissionalId, appointment.dataHora],
  );
  return rows[0]?.id;
}

async function ensureWaitlist(connection, patientId, professionalId, preferredDate, period, notes) {
  const [rows] = await connection.query(
    "SELECT id FROM lista_espera WHERE paciente_id = ? AND profissional_id = ? AND status IN ('Aguardando', 'Contatado') LIMIT 1",
    [patientId, professionalId],
  );
  if (rows.length) return rows[0].id;
  const [result] = await connection.query(
    "INSERT INTO lista_espera (paciente_id, profissional_id, data_preferida, periodo, observacoes) VALUES (?, ?, ?, ?, ?)",
    [patientId, professionalId, preferredDate, period, notes],
  );
  return result.insertId;
}

async function main() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const professional = await ensureProfessional(connection);
    const patients = [
      { nome: "Maria Oliveira", celular: "48999123344", problema: "Dor e limitação na coluna cervical", profissao: "Professora" },
      { nome: "João Pereira", celular: "48988772211", problema: "Dor no joelho após atividade física", profissao: "Contador" },
      { nome: "Carla Mendes", celular: "48991004455", problema: "Acompanhamento de pilates clínico", profissao: "Arquiteta" },
      { nome: "Beatriz Lima", celular: "48997721180", problema: "Reavaliação funcional", profissao: "Enfermeira" },
      { nome: "Renata Nunes", celular: "48984427701", problema: "Dor lombar recorrente", profissao: "Comerciante" },
      { nome: "Lucas Alves", celular: "48992310860", problema: "Tensão e dor cervical", profissao: "Desenvolvedor" },
    ];
    const ids = {};
    for (const patient of patients) ids[patient.nome] = await ensurePatient(connection, patient);

    const appointments = [
      ["Maria Oliveira", 0, 8, 0, "Retorno · coluna cervical", "Confirmado"],
      ["João Pereira", 0, 9, 0, "Avaliação · joelho", "Agendado"],
      ["Carla Mendes", 0, 11, 0, "Pilates clínico", "Confirmado"],
      ["Beatriz Lima", 0, 13, 30, "Reavaliação funcional", "Confirmado"],
      ["Lucas Alves", 1, 15, 0, "Sessão · cervical", "Confirmado"],
      ["Renata Nunes", 2, 9, 30, "Retorno · lombar", "Agendado"],
    ];
    for (const [name, day, hour, minute, type, status] of appointments) {
      await ensureAppointment(connection, {
        pacienteId: ids[name],
        profissionalId: professional.id,
        dataHora: mysqlDate(day, hour, minute),
        tipo: type,
        status,
      });
    }

    const tomorrow = mysqlDate(1, 9).slice(0, 10);
    await ensureWaitlist(connection, ids["Renata Nunes"], professional.id, tomorrow, "Manhã", "Aceita aviso com pouca antecedência");
    await ensureWaitlist(connection, ids["Lucas Alves"], professional.id, null, "Tarde", "Prefere depois das 15h");

    const previousId = await ensureAppointment(connection, {
      pacienteId: ids["Maria Oliveira"],
      profissionalId: professional.id,
      dataHora: mysqlDate(-1, 14, 30),
      tipo: "Retorno · coluna cervical",
      status: "Confirmado",
    });
    if (previousId) {
      await connection.query(
        "INSERT IGNORE INTO atendimentos "
          + "(agendamento_id, evolucao_clinica, procedimentos_realizados) "
          + "VALUES (?, 'Paciente apresentou redução da dor e ganho de amplitude.', "
          + "'Mobilização articular e exercícios ativos.')",
        [previousId],
      );
    }

    const messages = [
      ["48999123344", "entrada", "Oi, confirmo minha consulta de hoje.", "demo-in-1", 0],
      ["48999123344", "saida", "Consulta confirmada. Até breve!", "demo-out-1", 1],
      ["48988772211", "entrada", "Tenho horário marcado às 9h?", "demo-in-2", 0],
    ];
    for (const [number, direction, message, messageId, read] of messages) {
      await connection.query(
        "INSERT IGNORE INTO whatsapp_mensagens "
          + "(numero, direcao, texto, status, message_id, lida) "
          + "VALUES (?, ?, ?, 'enviada', ?, ?)",
        [number, direction, message, messageId, read],
      );
    }

    const [demoUsers] = await connection.query(
      "SELECT senha_hash FROM usuarios WHERE email = 'ana@fisiocare.demo' LIMIT 1",
    );
    const credentialsAreValid = demoUsers[0]
      ? await bcrypt.compare(professional.password, demoUsers[0].senha_hash)
      : false;
    if (!credentialsAreValid) throw new Error("As credenciais de demonstração não foram gravadas corretamente.");

    await connection.commit();
    console.log("Dados de demonstração carregados com sucesso.");
    console.log("Login de demonstração: ana@fisiocare.demo");
    console.log("Senha de demonstração: " + professional.password);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error("Falha ao carregar dados de demonstração:", error.message);
  process.exit(1);
});
